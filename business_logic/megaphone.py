import os
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPE = [
    'https://www.googleapis.com/auth/chat.bot',
    'https://www.googleapis.com/auth/documents.readonly'
]
SERVICE_ACCOUNT_FILE = '/tmp/auth.json'

credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPE)

class Megaphone:
    def __init__(self):
        self.current_time = datetime.now()


    def read_google_sheet(self):
        # 구글 시트를 불러온다
        # https://developers.google.com/resources/api-libraries/documentation/docs/v1/python/latest/docs_v1.documents.html
        DOCUMENT_ID = os.environ['MEGAPHONE_SHEET_ID']
        service = build('docs', 'v1', credentials=credentials)

        document = service.documents().get(documentId=DOCUMENT_ID).execute()


    def delete_target_row(self, target_row):
        return True


    def find_target_row(self, rows):
        target_rows = []

        return target_rows


    def generage_message(self, data):
        message = ''

        return message


    def send_message(self, message):
        return True
