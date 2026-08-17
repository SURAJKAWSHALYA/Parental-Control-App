import urllib.request
import os

base_url = "https://raw.githubusercontent.com/gradle/gradle/v8.7.0/"
files = {
    "gradlew": base_url + "gradlew",
    "gradlew.bat": base_url + "gradlew.bat",
    "gradle/wrapper/gradle-wrapper.properties": base_url + "gradle/wrapper/gradle-wrapper.properties",
    "gradle/wrapper/gradle-wrapper.jar": base_url + "gradle/wrapper/gradle-wrapper.jar"
}

os.makedirs("gradle/wrapper", exist_ok=True)

for path, url in files.items():
    print(f"Downloading {url} to {path}")
    urllib.request.urlretrieve(url, path)

print("Done")
