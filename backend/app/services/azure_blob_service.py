from azure.storage.blob import BlobServiceClient
from azure.identity import DefaultAzureCredential
from app.config import get_settings

settings = get_settings()

def get_blob_service_client():
    credential = DefaultAzureCredential()
    return BlobServiceClient(account_url=f"https://{settings.azure_storage_account}.blob.core.windows.net", credential=credential)


def upload_syllabus_pdf(syllabus_id: str, pdf_data: bytes) -> str:
    blob_name = f"syllabi/{syllabus_id}.pdf"
    blob_service_client = get_blob_service_client()
    container_client = blob_service_client.get_container_client("syllabi-media")
    blob_client = container_client.get_blob_client(blob_name)
    blob_client.upload_blob(pdf_data, overwrite=True)
    return blob_client.url


def get_syllabus_pdf(syllabus_id: str) -> str:
    blob_name = f"syllabi/{syllabus_id}.pdf"
    blob_service_client = get_blob_service_client()
    container_client = blob_service_client.get_container_client("syllabi-media")
    blob_client = container_client.get_blob_client(blob_name)
    return blob_client.url

def upload_media(container: str, blob_name: str, data: bytes) -> str:
    blob_service_client = get_blob_service_client()
    container_client = blob_service_client.get_container_client(container)
    blob_client = container_client.get_blob_client(blob_name)
    blob_client.upload_blob(data, overwrite=True)
    return blob_client.url

