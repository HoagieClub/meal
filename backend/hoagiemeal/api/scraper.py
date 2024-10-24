import requests
from bs4 import BeautifulSoup

class Scraper():
    def __init__(self):
      self.INGREDIENTS_CLASS = "labelingredientsvalue"
      self.ALLERGENS_CLASS = "labelallergensvalue"
      
    def get_html(self, link: str = None):
      print("Fetching HTML content...")
      if link is None or link == "":
        print("Error: No link found.")
        return
      try:
        response = requests.get(link)
        soup = BeautifulSoup(response.content, 'html5lib')
        print("HTML content fetched successfully.")
        return soup
      except Exception as e:
        print("Error: Failed to fetch HTML content. " + str(e))
        return None
        
    def get_ingredients(self, soup: BeautifulSoup = None):
      print("Extracting ingredients...")
      if soup is None or not isinstance(soup, BeautifulSoup):
        print("Error: No soup object found.")
        return
      try:
        element = soup.find_all(class_=self.INGREDIENTS_CLASS)[0]
        parsed = element.text.strip().split(",")
        items = [item.strip().capitalize() for item in parsed]
        print("Ingredients extracted successfully.")
        return items
      except Exception as e:
        print("Error: Failed to extract ingredients. " + str(e))
        return []
      
    def get_allergens(self, soup: BeautifulSoup = None):
      print("Extracting allergens...")
      if soup is None or not isinstance(soup, BeautifulSoup):
        print("Error: No soup object found.")
        return
      try:
        element = soup.find_all(class_=self.ALLERGENS_CLASS)[0]
        text = element.text.strip()
        PREFIX = "Ingredients include"
        if text.startswith(PREFIX):
          text = text[len(PREFIX):].strip()
        parsed = text.split(",")
        items = [item.strip().capitalize() for item in parsed]
        print("Allergens extracted successfully.")
        return items
      except Exception as e:
        print("Error: Failed to extract allergens. " + str(e))
        return []

scraper = Scraper()
link = "https://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort=520401"
soup = scraper.get_html(link=link)
allergens = scraper.get_allergens(soup=soup)
ingredients = scraper.get_ingredients(soup=soup)

print("\nAllergens:")
for allergen in allergens:
  print(allergen)

print("\nIngredients:")
for ingredient in ingredients:
  print(ingredient)