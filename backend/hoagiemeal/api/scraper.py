import requests
from bs4 import BeautifulSoup


class Scraper:
    def __init__(self):
        self.INGREDIENTS_CLASS = "labelingredientsvalue"
        self.ALLERGENS_CLASS = "labelallergensvalue"
        self.SERVING_SIZE_ID = "facts2"
        self.CALORIES_ID = "facts2"
        
        self.CALORIES_PREFIX = "Calories"
        self.CALORIES_FAT_PREFIX = "Calories from Fat"
        self.SERVING_SIZE_PREFIX = "Serving Size"
        self.ALLERGENS_PREFIX = "Ingredients include"

    def get_html(self, link: str = None):
        print("Fetching HTML content...")
        if link is None or link == "":
            print("Error: No link found.")
            return None
        try:
            response = requests.get(link)
            soup = BeautifulSoup(response.content, "lxml")
            print("HTML content fetched successfully.")
            return soup
        except Exception as e:
            print("Error: Failed to fetch HTML content. " + str(e))
            return None

    def get_ingredients(self, soup: BeautifulSoup = None):
        if soup is None or not isinstance(soup, BeautifulSoup):
            print("Error: No soup object found.")
            return {
                "Ingredients": [],
            }
        try:
            element = soup.find_all(class_=self.INGREDIENTS_CLASS)[0]
            parsed = element.text.strip().split(",")
            items = [item.strip().capitalize() for item in parsed]
            return {
                "Ingredients": items,
            }
        except Exception as e:
            print("Error: Failed to extract ingredients. " + str(e))
            return {
                "Ingredients": [],
            }

    def get_allergens(self, soup: BeautifulSoup = None):
        if soup is None or not isinstance(soup, BeautifulSoup):
            print("Error: No soup object found.")
            return {
                "Allergens": [],
            }
        try:
            element = soup.find_all(class_=self.ALLERGENS_CLASS)[0]
            text = element.text.strip()
            if text.startswith(self.ALLERGENS_PREFIX):
                text = text[len(self.ALLERGENS_PREFIX) :].strip()
            items = [item.strip().capitalize() for item in text.split(",")]
            return {
                "Allergens": items,
            }
        except Exception as e:
            print("Error: Failed to extract allergens. " + str(e))
            return {
                "Allergens": [],
            }

    def get_basic_info(self, soup: BeautifulSoup = None):
        if soup is None or not isinstance(soup, BeautifulSoup):
            print("Error: No soup object found.")
            return {
                "Name": "",
                "Serving Size": "",
                "Calories": "",
                "Calories from Fat": "",
            }
        try:
            elements = soup.find_all("div", id="facts2")
            size, calories, fat_calories = "", "", ""
            for element in elements:
                text = element.text.strip()
                if self.SERVING_SIZE_PREFIX in element.text:
                    size = text[len(self.SERVING_SIZE_PREFIX) :].strip() or ""
                elif (
                    self.CALORIES_PREFIX in element.text
                    and self.CALORIES_FAT_PREFIX not in element.text
                ):
                    stripped = text[len(self.CALORIES_PREFIX) :].strip()
                    calories = stripped if stripped.isnumeric() else ""
                elif self.CALORIES_FAT_PREFIX in element.text:
                    stripped = text[len(self.CALORIES_FAT_PREFIX) :].strip()
                    fat_calories = stripped if stripped.isnumeric() else ""
            element = soup.find_all("h2")[0]
            name = element.text.strip() or ""
            return {
                "Name": name,
                "Serving Size": size,
                "Calories": calories,
                "Calories from Fat": fat_calories,
            }
        except Exception as e:
            print("Error: Failed to extract serving size. " + str(e))
            return {"Name": "", "Serving Size": "", "Calories": ""}


def test_scraper():
    scraper = Scraper()
    link = "https://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort=520401"

    soup = scraper.get_html(link=link)
    allergens = scraper.get_allergens(soup=soup)
    ingredients = scraper.get_ingredients(soup=soup)
    basic_info = scraper.get_basic_info(soup=soup)

    print(allergens["Allergens"])
    print(ingredients["Ingredients"])
    print(basic_info["Name"])
    print(basic_info["Serving Size"])
    print(basic_info["Calories"])
    print(basic_info["Calories from Fat"])


if __name__ == "__main__":
    test_scraper()
