import requests
import sys
import json
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image
import time

class BauDokAPITester:
    def __init__(self, base_url="https://handover-docs-photo.preview.emergentagent.com"):
        self.base_url = base_url
        self.api = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_ids = []
        self.image_ids = []

    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            return False, {}

    def create_test_image(self):
        """Create a simple test image"""
        img = Image.new('RGB', (100, 100), color='red')
        img_buffer = BytesIO()
        img.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        return img_buffer

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        return success

    def test_create_project(self, name, description=""):
        """Test project creation"""
        success, response = self.run_test(
            f"Create Project: {name}",
            "POST",
            "projects",
            200,
            data={"name": name, "description": description}
        )
        if success and 'id' in response:
            self.project_ids.append(response['id'])
            return response['id']
        return None

    def test_get_projects(self):
        """Test getting all projects"""
        success, response = self.run_test(
            "Get All Projects",
            "GET",
            "projects",
            200
        )
        return success, response

    def test_search_projects(self, search_term):
        """Test project search"""
        success, response = self.run_test(
            f"Search Projects: {search_term}",
            "GET",
            f"projects?search={search_term}",
            200
        )
        return success, response

    def test_get_project(self, project_id):
        """Test getting a specific project"""
        success, response = self.run_test(
            f"Get Project: {project_id}",
            "GET",
            f"projects/{project_id}",
            200
        )
        return success, response

    def test_update_project(self, project_id, name=None, description=None):
        """Test project update"""
        update_data = {}
        if name:
            update_data['name'] = name
        if description is not None:
            update_data['description'] = description
            
        success, response = self.run_test(
            f"Update Project: {project_id}",
            "PUT",
            f"projects/{project_id}",
            200,
            data=update_data
        )
        return success, response

    def test_get_tags(self):
        """Test getting predefined tags"""
        success, response = self.run_test(
            "Get Predefined Tags",
            "GET",
            "tags",
            200
        )
        return success, response

    def test_upload_image(self, project_id, category, description="Test image", tags="", lat=None, lng=None, address=""):
        """Test image upload with tags and GPS location"""
        img_buffer = self.create_test_image()
        files = {
            'file': ('test.jpg', img_buffer, 'image/jpeg')
        }
        data = {
            'category': category,
            'description': description,
            'tags': tags,
            'address': address
        }
        if lat is not None:
            data['lat'] = lat
        if lng is not None:
            data['lng'] = lng
        
        test_name = f"Upload Image to {category}"
        if tags:
            test_name += f" with tags: {tags}"
        if lat is not None and lng is not None:
            test_name += f" with GPS: {lat}, {lng}"
        
        success, response = self.run_test(
            test_name,
            "POST",
            f"projects/{project_id}/images",
            200,
            data=data,
            files=files
        )
        if success and 'id' in response:
            self.image_ids.append(response['id'])
            return response['id']
        return None

    def test_get_project_images(self, project_id, category=None, date_from=None, date_to=None):
        """Test getting project images with filters"""
        endpoint = f"projects/{project_id}/images"
        params = []
        if category:
            params.append(f"category={category}")
        if date_from:
            params.append(f"date_from={date_from}")
        if date_to:
            params.append(f"date_to={date_to}")
        
        if params:
            endpoint += "?" + "&".join(params)
        
        filter_info = f" (category: {category}, date_from: {date_from}, date_to: {date_to})" if any([category, date_from, date_to]) else ""
        success, response = self.run_test(
            f"Get Project Images{filter_info}",
            "GET",
            endpoint,
            200
        )
        return success, response

    def test_get_image_data(self, image_id):
        """Test getting image binary data"""
        success, _ = self.run_test(
            f"Get Image Data: {image_id}",
            "GET",
            f"images/{image_id}/data",
            200
        )
        return success

    def test_update_image_description(self, image_id, description):
        """Test updating image description"""
        success, response = self.run_test(
            f"Update Image Description: {image_id}",
            "PUT",
            f"images/{image_id}",
            200,
            data={"description": description}
        )
        return success

    def test_delete_image(self, image_id):
        """Test image deletion"""
        success, response = self.run_test(
            f"Delete Image: {image_id}",
            "DELETE",
            f"images/{image_id}",
            200
        )
        return success

    def test_delete_project(self, project_id):
        """Test project deletion"""
        success, response = self.run_test(
            f"Delete Project: {project_id}",
            "DELETE",
            f"projects/{project_id}",
            200
        )
        return success

    def run_comprehensive_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting BauDok API Tests...")
        
        # Test API root
        if not self.test_api_root():
            self.log("❌ API root test failed - stopping tests")
            return False

        # Test project creation
        project_id = self.test_create_project("Test Project", "Test project description")
        if not project_id:
            self.log("❌ Project creation failed - stopping tests")
            return False

        # Test getting projects
        self.test_get_projects()

        # Test project search
        self.test_search_projects("Test")
        self.test_search_projects("Nonexistent")

        # Test getting specific project
        self.test_get_project(project_id)

        # Test project update
        self.test_update_project(project_id, "Updated Test Project", "Updated description")

        # Test image uploads for all categories
        categories = ["alapszereles", "szerelvenyezes", "atadas"]
        uploaded_images = []
        
        for category in categories:
            image_id = self.test_upload_image(project_id, category, f"Test image for {category}")
            if image_id:
                uploaded_images.append((image_id, category))

        # Test getting project images
        self.test_get_project_images(project_id)
        
        # Test filtering by category
        for category in categories:
            self.test_get_project_images(project_id, category=category)

        # Test date filtering
        today = datetime.now().strftime("%Y-%m-%d")
        self.test_get_project_images(project_id, date_from=today, date_to=today)

        # Test image operations
        for image_id, category in uploaded_images:
            # Test getting image data
            self.test_get_image_data(image_id)
            
            # Test updating image description
            self.test_update_image_description(image_id, f"Updated description for {category}")

        # Test image deletion
        if uploaded_images:
            image_id_to_delete = uploaded_images[0][0]
            self.test_delete_image(image_id_to_delete)

        # Test project deletion (this will also delete remaining images)
        self.test_delete_project(project_id)

        # Test getting non-existent resources (should return 404)
        self.run_test("Get Non-existent Project", "GET", f"projects/non-existent", 404)
        self.run_test("Get Non-existent Image", "GET", f"images/non-existent/data", 404)

        return True

def main():
    # Setup
    tester = BauDokAPITester()
    
    try:
        # Run comprehensive tests
        success = tester.run_comprehensive_tests()
        
        # Print results
        print("\n" + "="*60)
        print(f"📊 TEST SUMMARY")
        print("="*60)
        print(f"Tests Run: {tester.tests_run}")
        print(f"Tests Passed: {tester.tests_passed}")
        print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
        success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success and tester.tests_passed == tester.tests_run:
            print("🎉 All tests passed! Backend is working correctly.")
            return 0
        else:
            print("⚠️ Some tests failed. Check the logs above.")
            return 1
            
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())