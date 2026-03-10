import os
import subprocess
import tempfile
import logging

from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_video_hls(self, lecture_id):
    """
    Convert an uploaded video to HLS format using ffmpeg, then upload
    the segments and playlist to DigitalOcean Spaces.
    """
    from .models import Lecture

    try:
        lecture = Lecture.objects.select_related('module__course').get(id=lecture_id)
    except Lecture.DoesNotExist:
        logger.error(f"Lecture {lecture_id} not found.")
        return

    lecture.hls_status = Lecture.HLSStatus.PROCESSING
    lecture.save(update_fields=['hls_status'])

    try:
        input_path = _get_input_path(lecture)
        with tempfile.TemporaryDirectory() as tmpdir:
            playlist_path = os.path.join(tmpdir, 'playlist.m3u8')
            _run_ffmpeg(input_path, tmpdir, playlist_path)
            duration = _get_duration(input_path)
            hls_url = _upload_hls_to_storage(lecture, tmpdir)

        lecture.hls_status = Lecture.HLSStatus.READY
        lecture.hls_playlist_url = hls_url
        if duration:
            lecture.duration_seconds = int(duration)
        lecture.save(update_fields=['hls_status', 'hls_playlist_url', 'duration_seconds'])
        logger.info(f"Lecture {lecture_id} HLS processing complete.")

    except Exception as exc:
        logger.exception(f"HLS processing failed for lecture {lecture_id}: {exc}")
        lecture.hls_status = Lecture.HLSStatus.FAILED
        lecture.save(update_fields=['hls_status'])
        raise self.retry(exc=exc)


def _get_input_path(lecture):
    """Resolve the absolute path or URL of the source video file."""
    if hasattr(settings, 'DEFAULT_FILE_STORAGE') and 'S3' in settings.DEFAULT_FILE_STORAGE:
        # For cloud storage, download to a temp file
        import boto3
        from botocore.client import Config

        s3 = boto3.client(
            's3',
            region_name=settings.AWS_S3_REGION_NAME,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4'),
        )
        tmp = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
        s3.download_fileobj(settings.AWS_STORAGE_BUCKET_NAME, lecture.video_file.name, tmp)
        tmp.flush()
        return tmp.name
    else:
        return lecture.video_file.path


def _run_ffmpeg(input_path, output_dir, playlist_path):
    """Run ffmpeg to produce adaptive HLS output."""
    cmd = [
        'ffmpeg', '-y', '-i', input_path,
        '-c:v', 'libx264', '-crf', '23', '-preset', 'fast',
        '-c:a', 'aac', '-b:a', '128k',
        '-hls_time', '6',
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', os.path.join(output_dir, 'segment%03d.ts'),
        playlist_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg error: {result.stderr[-2000:]}")


def _get_duration(input_path):
    """Return video duration in seconds using ffprobe."""
    try:
        result = subprocess.run(
            [
                'ffprobe', '-v', 'quiet',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                input_path,
            ],
            capture_output=True, text=True, timeout=30,
        )
        return float(result.stdout.strip())
    except Exception:
        return None


def _upload_hls_to_storage(lecture, hls_dir):
    """Upload all HLS files to storage and return the playlist URL."""
    course_slug = lecture.module.course.slug
    base_key = f"lectures/hls/{course_slug}/{lecture.id}"

    if hasattr(settings, 'AWS_STORAGE_BUCKET_NAME') and settings.AWS_STORAGE_BUCKET_NAME:
        return _upload_to_spaces(lecture, hls_dir, base_key)
    else:
        return _move_to_local_media(lecture, hls_dir, base_key)


def _upload_to_spaces(lecture, hls_dir, base_key):
    import boto3
    from botocore.client import Config

    s3 = boto3.client(
        's3',
        region_name=settings.AWS_S3_REGION_NAME,
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
    )

    playlist_url = None
    for fname in os.listdir(hls_dir):
        fpath = os.path.join(hls_dir, fname)
        key = f"{base_key}/{fname}"
        content_type = 'application/x-mpegURL' if fname.endswith('.m3u8') else 'video/MP2T'
        s3.upload_file(
            fpath, settings.AWS_STORAGE_BUCKET_NAME, key,
            ExtraArgs={'ACL': 'public-read', 'ContentType': content_type},
        )
        if fname == 'playlist.m3u8':
            cdn = getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', None)
            if cdn:
                playlist_url = f"https://{cdn}/{key}"
            else:
                playlist_url = f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{key}"

    return playlist_url


def _move_to_local_media(lecture, hls_dir, base_key):
    """For local dev: copy HLS files into MEDIA_ROOT and return a relative URL."""
    import shutil

    dest_dir = os.path.join(settings.MEDIA_ROOT, base_key)
    os.makedirs(dest_dir, exist_ok=True)
    for fname in os.listdir(hls_dir):
        shutil.copy(os.path.join(hls_dir, fname), os.path.join(dest_dir, fname))

    return f"{settings.MEDIA_URL}{base_key}/playlist.m3u8"
