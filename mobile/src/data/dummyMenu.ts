export type Nutrition = {
  servingSize?: number | null;
  servingUnit?: string | null;
  calories?: number | null;
  sodium?: number | null;
  totalFat?: number | null;
  saturatedFat?: number | null;
  transFat?: number | null;
  protein?: number | null;
  totalCarbohydrates?: number | null;
  dietaryFiber?: number | null;
  sugars?: number | null;
  cholesterol?: number | null;
  vitaminD?: number | null;
  calcium?: number | null;
  iron?: number | null;
  potassium?: number | null;
  ingredients?: string | null;
  allergens?: string | null;
};

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  likes: number;
  dislikes: number;
  nutrition?: Nutrition;
};

export type DiningHallData = {
  id: string;
  name: string;
  displayName: string;
  menu: MenuItem[];
};

export const DUMMY_DINING_HALL: DiningHallData = {
  id: "grad",
  name: "Graduate College",
  displayName: "Grad",
  menu: [
    {
      id: "1",
      name: "Mediterranean Meatloaf",
      category: "Main Entree",
      likes: 3,
      dislikes: 1,
      nutrition: {
        servingSize: 8,
        servingUnit: "oz",
        calories: 376,
        sodium: 473.8,
        totalFat: 19.9,
        saturatedFat: 8,
        transFat: 1,
        protein: 31.8,
        totalCarbohydrates: null,
        dietaryFiber: 2.4,
        sugars: null,
        cholesterol: 162.7,
        vitaminD: 0,
        calcium: 74,
        iron: 4.3,
        potassium: 602.5,
        ingredients:
          "Halal Ground Beef, Carrots, Bread Crumbs, Eggs, Mushrooms, Spanish Onions, Tomato Paste, Rosemary",
        allergens: "milk wheat egg",
      },
    },
    { id: "2", name: "Vegan Moussaka", category: "Vegetarian & Vegan Entree", likes: 5, dislikes: 0 },
    { id: "3", name: "All Beef Hot Dog", category: "Grill", likes: 2, dislikes: 0 },
    { id: "4", name: "Beyond Burger", category: "Grill", likes: 7, dislikes: 2 },
    { id: "5", name: "Cheesesteak Sandwich", category: "Grill", likes: 4, dislikes: 1 },
    { id: "6", name: "Grilled Chicken Sandwich", category: "Grill", likes: 6, dislikes: 0 },
    { id: "7", name: "Grilled Hamburger Blend", category: "Grill", likes: 1, dislikes: 3 },
    { id: "8", name: "Falafel", category: "On the Side", likes: 8, dislikes: 0 },
    { id: "9", name: "Middle Eastern Rice Pilaf", category: "On the Side", likes: 2, dislikes: 1 },
    { id: "10", name: "Roasted Beets", category: "On the Side", likes: 1, dislikes: 4 },
    { id: "11", name: "Saksuka", category: "On the Side", likes: 0, dislikes: 0 },
    { id: "12", name: "Tzatziki", category: "On the Side", likes: 3, dislikes: 0 },
    { id: "13", name: "Butternut Squash Soup", category: "Soups", likes: 5, dislikes: 1 },
  ],
};
