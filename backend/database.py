import os
from pymongo import MongoClient

class StudentQuerySet:
    def __init__(self, collection):
        self.collection = collection

    def all(self):
        # Retrieve all documents from the students collection
        docs = list(self.collection.find({}))
        # Map raw dictionaries to StudentDoc objects to allow dot-notation access
        return [StudentDoc(doc) for doc in docs]

class StudentDoc:
    def __init__(self, data):
        self._id = data.get('_id')
        self.name = data.get('name', '')
        self.email = data.get('email', '')
        self.skills = data.get('skills', {})
        self.projects = data.get('projects', [])
        self.experience_summary = data.get('experience_summary', {})
        self.interests = data.get('interests', [])
        self.availability = data.get('availability', '')

class StudentManager:
    def __init__(self):
        # Default connection matching the Node.js backend
        mongo_uri = os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017/collabix")
        self.client = MongoClient(mongo_uri)
        # Fallback to 'collabix' if default is missing in connection string
        default_db = self.client.get_default_database(default=None)
        self.db = default_db if default_db is not None else self.client['collabix']
        # The Mongoose model 'Student' created a 'students' collection
        self.collection = self.db['students']
        self.objects = StudentQuerySet(self.collection)

# Export an instance of StudentManager as 'Student' to match the expected API: Student.objects.all()
Student = StudentManager()
