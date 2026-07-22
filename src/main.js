
import { foodOptions, instamartCategories, dineoutRestaurants, restaurants, groceryItems, ninetyNineStoreItems, trainStationRestaurants, categoryDishes } from './data.js';

// --- State Variables ---
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let activeTab = 'food'; // 'food' | 'grocery' | 'dineout'
let selectedRestaurant = null;
let searchQuery = '';
let activeGroceryCategory = 'veg';
let appliedCoupon = null; // 'SWIGGY60'
let activeCheckoutStep = 1;
let selectedPaymentMethod = 'upi';
let deliveryAddress = {
  name: 'Jane Doe',
  house: 'Flat 405, Block B, Royal Palms',
  area: 'Near Koramangala Post Office',
  pin: '560034'
};
let trackingTimer = null;
let activeFoodCategory = 'all';

// Location-based dynamic Gourmet Restaurants generator (simulates Google Maps parsing to create 15 top restaurants)
function generateLocationRestaurants(locationText) {
  const baseCuisines = [
    ['Biryani', 'North Indian'], ['South Indian', 'Breakfast'], ['Italian', 'Pizzas', 'Pastas'],
    ['Burgers', 'Fast Food'], ['Chinese', 'Noodles'], ['Desserts', 'Cakes'],
    ['Mughlai', 'Tandoor'], ['Salads', 'Healthy'], ['Cafe', 'Beverages'], ['Seafood', 'Continental']
  ];
  
  const generated = [];
  const cleanLoc = locationText.split(',')[0].trim();
  
  for (let i = 1; i <= 15; i++) {
    const cuisinesPair = baseCuisines[(i - 1) % baseCuisines.length];
    const rating = (4.0 + (i % 9) * 0.1).toFixed(1);
    const deliveryTime = (10 + (i % 6) * 5) + ' mins';
    const costForTwo = 200 + (i % 7) * 100;
    const isVeg = i % 4 === 0;
    
    const prefixes = ['Royal', 'Grand', 'Gourmet', 'Delhi', 'Chef\'s', 'Spice', 'Tandoori', 'Wok', 'Desi', 'Cafe', 'Golden', 'Windmill', 'Paradise', 'Empire', 'Barbeque'];
    const suffixes = ['Bistro', 'Junction', 'Hub', 'Palace', 'Kitchen', 'Inn', 'Diner', 'Express', 'House', 'Flavors', 'Garden', 'Corner', 'Delights', 'Lounge', 'Cafe'];
    
    const restName = `${prefixes[(i * 3) % prefixes.length]} ${suffixes[(i * 7) % suffixes.length]}`;
    
    let image = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80';
    if (cuisinesPair.includes('Biryani')) image = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80';
    else if (cuisinesPair.includes('South Indian')) image = 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=500&q=80';
    else if (cuisinesPair.includes('Pizzas')) image = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80';
    else if (cuisinesPair.includes('Burgers')) image = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80';
    else if (cuisinesPair.includes('Chinese')) image = 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80';
    else if (cuisinesPair.includes('Desserts')) image = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80';

    generated.push({
      id: `loc-${cleanLoc.toLowerCase().replace(/[^a-z0-9]/g, '')}-${i}`,
      name: `${restName} (${cleanLoc})`,
      image: image,
      rating: parseFloat(rating),
      deliveryTime: deliveryTime,
      costForTwo: costForTwo,
      cuisines: cuisinesPair,
      isVeg: isVeg,
      featured: i % 5 === 0,
      isBolt: parseInt(deliveryTime) <= 15,
      location: cleanLoc,
      menu: [
        { id: `loc-menu-${i}-1`, name: `Chef Special ${cuisinesPair[0]} Platter`, price: 199, description: `Authentic spices and local touch of ${cleanLoc} in this signature dish.`, image: image, isVeg: isVeg },
        { id: `loc-menu-${i}-2`, name: `Crispy ${cuisinesPair[1] || 'Soft Drink'} Combo`, price: 120, description: `Highly rated side item to complete your meals.`, image: '/images/img_1.jpg', isVeg: true }
      ]
    });
  }
  return generated;
}

let currentLocationRestaurants = generateLocationRestaurants('Koramangala, Bangalore');

// Fetch real-time restaurant data from OpenStreetMap (Nominatim API) simulating Google Maps API
async function fetchRealRestaurantsFromLocation(locationText) {
  // Show a loading spinner in the grid container
  const grid = document.querySelector('.restaurants-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="loading-restaurants-spinner" style="grid-column: span 3; text-align:center; padding: 48px;">
        <div class="spinner" style="margin: 0 auto 16px auto; border: 4px solid var(--primary-light); border-top: 4px solid var(--primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
        <p style="color: var(--text-dark); font-weight: 600; font-family: var(--font-family-title); font-size: 16px;">Searching Google Maps for real restaurants...</p>
        <p style="color: var(--text-muted); font-size: 13px; margin-top: 6px;">Scanning coordinates for "${locationText}"...</p>
      </div>
    `;
  }

  try {
    const query = encodeURIComponent(locationText);
    const url = `https://nominatim.openstreetmap.org/search?q=restaurants+in+${query}&format=json&limit=15&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FoodBuds-Delivery-App/2.4'
      }
    });

    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('No real restaurants found at this location');
    }

    const cleanLoc = locationText.split(',')[0].trim();
    const newRestaurants = [];

    // Define context-aware menu templates that contain Idli, Dosa, Vada, Coffee, Cake, Paratha, Juice, etc.
    const menuTemplates = {
      southIndian: [
        { id: 'item-dosa', name: 'Special Ghee Roast Masala Dosa', price: 110, description: 'Crispy rice crepe roast with spiced potato mash, served with sambar & chutney.', image: '/images/img_2.jpg', isVeg: true },
        { id: 'item-idli', name: 'Steamed Rice Idli (2 Pcs)', price: 60, description: 'Soft, fluffy steamed rice cakes served with fresh coconut chutney & lentil sambar.', image: '/images/img_3.jpg', isVeg: true },
        { id: 'item-vada', name: 'Crispy Medu Vada (2 Pcs)', price: 70, description: 'Crispy deep-fried lentil donuts served with hot sambar and fresh chutney.', image: '/images/img_4.jpg', isVeg: true },
        { id: 'item-coffee', name: 'Traditional Filter Coffee', price: 45, description: 'Rich chicory-blend coffee brewed with hot frothy milk.', image: '/images/img_5.jpg', isVeg: true }
      ],
      northIndian: [
        { id: 'item-paratha-1', name: 'Amritsari Aloo Paratha', price: 90, description: 'Flaky flatbread stuffed with spiced potato mash, cooked in butter.', image: '/images/img_6.jpg', isVeg: true },
        { id: 'item-paratha-2', name: 'Tandoori Paneer Paratha', price: 110, description: 'Flatbread stuffed with spiced cottage cheese cubes, cooked in clay oven.', image: '/images/img_6.jpg', isVeg: true },
        { id: 'item-butter-paneer', name: 'Paneer Butter Masala Combo', price: 210, description: 'Rich, creamy cottage cheese in tomato gravy, served with 2 butter rotis & rice.', image: '/images/img_7.jpg', isVeg: true },
        { id: 'item-dal', name: 'Dal Makhani Thali', price: 190, description: 'Slow cooked black lentils with cream & butter, served with rice & salad.', image: '/images/img_8.jpg', isVeg: true }
      ],
      italian: [
        { id: 'item-pizza', name: 'Double Cheese Margherita Pizza', price: 250, description: 'Classic pizza base loaded with double mozzarella cheese and fresh basil.', image: '/images/img_9.jpg', isVeg: true },
        { id: 'item-pasta', name: 'Creamy Alfredo Pasta', price: 220, description: 'Penne pasta tossed in rich parmesan white cream sauce with mushrooms.', image: '/images/img_10.jpg', isVeg: true }
      ],
      fastfood: [
        { id: 'item-burger', name: 'Crispy Veggie Cheese Burger', price: 120, description: 'Crispy veg patty, sliced cheese, lettuce, tomato, and special burger sauce.', image: '/images/img_11.jpg', isVeg: true },
        { id: 'item-zinger', name: 'Spicy Chicken Zinger Burger', price: 160, description: 'Deep fried crispy chicken breast fillet with spicy mayo & lettuce.', image: '/images/img_11.jpg', isVeg: false }
      ],
      chinese: [
        { id: 'item-noodles', name: 'Schezwan Veg Noodles', price: 150, description: 'Wok-tossed noodles with green veggies in fiery home-made Schezwan sauce.', image: '/images/img_12.jpg', isVeg: true },
        { id: 'item-manchurian', name: 'Manchurian Gravy Combo', price: 180, description: 'Fried vegetable balls in thick ginger-garlic soy gravy, served with fried rice.', image: '/images/img_12.jpg', isVeg: true }
      ],
      bakery: [
        { id: 'item-cake-1', name: 'Red Velvet Pastry Slice', price: 130, description: 'Crimson cocoa sponge layered with vanilla cream cheese frosting.', image: '/images/img_13.jpg', isVeg: true },
        { id: 'item-cake-2', name: 'Death By Chocolate Muffin', price: 90, description: 'Rich chocolate cake with a molten lava center.', image: '/images/img_14.jpg', isVeg: true }
      ],
      beverages: [
        { id: 'item-juice-1', name: 'Fresh Orange Juice', price: 80, description: 'Pulp loaded fresh squeezed sweet oranges.', image: '/images/img_15.jpg', isVeg: true },
        { id: 'item-juice-2', name: 'Ice Watermelon Mint Juice', price: 70, description: 'Sweet red watermelon blend served chilled.', image: '/images/img_11.jpg', isVeg: true }
      ]
    };

    data.forEach((place, index) => {
      const rawName = place.display_name.split(',')[0].trim();
      const lowerName = rawName.toLowerCase();
      
      let cuisineTag = 'northIndian';
      let cuisinesList = ['North Indian', 'Main Course'];
      
      if (lowerName.includes('pizza') || lowerName.includes('pasta') || lowerName.includes('italian') || lowerName.includes('domino') || lowerName.includes('pizza hut')) {
        cuisineTag = 'italian';
        cuisinesList = ['Italian', 'Pizzas', 'Pastas'];
      } else if (lowerName.includes('coffee') || lowerName.includes('cafe') || lowerName.includes('tea') || lowerName.includes('starbucks') || lowerName.includes('juice') || lowerName.includes('beverage')) {
        cuisineTag = 'beverages';
        cuisinesList = ['Cafe', 'Beverages', 'Juices'];
      } else if (lowerName.includes('burger') || lowerName.includes('mcdonald') || lowerName.includes('kfc') || lowerName.includes('subway') || lowerName.includes('fast') || lowerName.includes('sandwich')) {
        cuisineTag = 'fastfood';
        cuisinesList = ['Burgers', 'Fast Food', 'Snacks'];
      } else if (lowerName.includes('dosa') || lowerName.includes('idli') || lowerName.includes('vada') || lowerName.includes('south') || lowerName.includes('udupi') || lowerName.includes('saravana')) {
        cuisineTag = 'southIndian';
        cuisinesList = ['South Indian', 'Breakfast'];
      } else if (lowerName.includes('china') || lowerName.includes('chinese') || lowerName.includes('wok') || lowerName.includes('noodle') || lowerName.includes('asian')) {
        cuisineTag = 'chinese';
        cuisinesList = ['Chinese', 'Noodles', 'Asian'];
      } else if (lowerName.includes('cake') || lowerName.includes('bakery') || lowerName.includes('baker') || lowerName.includes('pastry') || lowerName.includes('sweet')) {
        cuisineTag = 'bakery';
        cuisinesList = ['Bakery', 'Desserts', 'Cakes'];
      } else if (lowerName.includes('biryani') || lowerName.includes('kebab') || lowerName.includes('palace') || lowerName.includes('hotel') || lowerName.includes('restaurant')) {
        cuisineTag = 'northIndian';
        cuisinesList = ['Biryani', 'North Indian', 'Tandoori'];
      }

      const selectedMenuTemplate = menuTemplates[cuisineTag] || menuTemplates.northIndian;
      const restMenu = selectedMenuTemplate.map((dish, dIndex) => ({
        id: `real-menu-${index}-${dIndex}`,
        name: dish.name,
        price: dish.price,
        description: dish.description,
        image: dish.image,
        isVeg: dish.isVeg
      }));

      // High quality visuals
      let image = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80';
      if (cuisineTag === 'northIndian') image = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80';
      else if (cuisineTag === 'southIndian') image = 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=500&q=80';
      else if (cuisineTag === 'italian') image = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80';
      else if (cuisineTag === 'fastfood') image = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80';
      else if (cuisineTag === 'chinese') image = 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80';
      else if (cuisineTag === 'bakery' || cuisineTag === 'beverages') image = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80';

      const rating = (4.0 + (index % 9) * 0.1).toFixed(1);
      const deliveryTime = (15 + (index % 5) * 5) + ' mins';
      const costForTwo = 150 + (index % 6) * 100;
      const isVeg = cuisineTag === 'southIndian' || cuisineTag === 'bakery' || index % 3 === 0;

      newRestaurants.push({
        id: `real-rest-${index}`,
        name: rawName,
        image: image,
        rating: parseFloat(rating),
        deliveryTime: deliveryTime,
        costForTwo: costForTwo,
        cuisines: cuisinesList,
        isVeg: isVeg,
        featured: index % 4 === 0,
        isBolt: parseInt(deliveryTime) <= 20,
        location: cleanLoc,
        menu: restMenu
      });
    });

    currentLocationRestaurants = newRestaurants;
    renderActiveTab();
  } catch (error) {
    console.warn("Real-time restaurant geocoding failed or offline, using simulated restaurants:", error);
    currentLocationRestaurants = generateLocationRestaurants(locationText);
    renderActiveTab();
  }
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  renderHeader();
  renderActiveTab();
  updateCartCount();
  fetchRealRestaurantsFromLocation('Koramangala, Bangalore');
});

// --- Dynamic Header Render ---
function renderHeader() {
  const authSection = document.getElementById('auth-header-section');
  if (currentUser) {
    authSection.innerHTML = `
      <div class="user-profile-menu" id="user-profile-menu">
        <div class="user-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
        <span class="location-text" style="font-weight:600">${currentUser.name}</span>
        <button id="header-signout-btn" style="font-size:12px; color:var(--primary); font-weight:700; margin-left:8px;">Sign Out</button>
      </div>
    `;
    document.getElementById('header-signout-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      logoutUser();
    });
  } else {
    authSection.innerHTML = `
      <button class="btn-sign-in" id="header-signin-btn"><i class="fa-solid fa-user"></i> Sign In</button>
    `;
    document.getElementById('header-signin-btn').addEventListener('click', () => {
      openModal('auth-modal');
    });
  }
}

// --- Cart Badge Logic ---
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cart-count');
  badge.textContent = count;
  if (count > 0) {
    badge.classList.add('pulse-badge');
    setTimeout(() => badge.classList.remove('pulse-badge'), 300);
  }
}

// --- Tab Rendering Router ---
function renderActiveTab() {
  const container = document.getElementById('dynamic-content');
  container.innerHTML = ''; // Clear previous

  // Set active tab card styling
  document.querySelectorAll('.tab-card').forEach(card => {
    if (card.dataset.tab === activeTab) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  // Apply page level theme classes to body for CSS rules
  document.body.className = `theme-${activeTab}`;

  if (activeTab === 'food') {
    renderFoodTab(container);
  } else if (activeTab === 'grocery') {
    renderGroceryTab(container);
  } else if (activeTab === 'dineout') {
    renderDineoutTab(container);
  }
}

// --- FOOD DELIVERY TAB ---
function renderFoodTab(container) {
  // Food Options horizontal scroll (Slider 3 list)
  const optionsHTML = foodOptions.map(opt => `
    <div class="food-option-card" data-food-id="${opt.id}">
      <div class="food-option-img-wrapper">
        <img src="${opt.image}" alt="${opt.name}">
      </div>
      <div class="food-option-name">${opt.name}</div>
    </div>
  `).join('');

  // Filter Pills
  const filtersHTML = `
    <div class="filters-container">
      <button class="filter-pill active" id="filter-all">All</button>
      <button class="filter-pill" id="filter-veg"><i class="fa-solid fa-leaf" style="color:var(--success)"></i> Pure Veg</button>
      <button class="filter-pill" id="filter-rating">Ratings 4.0+</button>
      <button class="filter-pill" id="filter-fast">Fast Delivery</button>
    </div>
  `;

  // Foodie Verse Promos
  const foodieVerseHTML = `
    <div class="foodie-verse-container">
      <div class="foodie-verse-header">
        <span class="foodie-verse-logo">FOODIE VERSE</span>
        <span class="foodie-verse-title">FLAT ₹150 OFF</span>
      </div>
      <div class="deals-grid">
        <div class="deal-card" data-deal="feast">
          <div>
            <div class="deal-tag">Deal Feast</div>
            <div class="deal-title">GET 70% OFF</div>
          </div>
          <i class="fa-solid fa-percent deal-icon"></i>
        </div>
        <div class="deal-card" data-deal="flat">
          <div>
            <div class="deal-tag">Flat Discount</div>
            <div class="deal-title">FLAT ₹150 OFF</div>
          </div>
          <i class="fa-solid fa-wallet deal-icon"></i>
        </div>
        <div class="deal-card" data-deal="bogo">
          <div>
            <div class="deal-tag">BOGO OFFER</div>
            <div class="deal-title">Buy One, Get One</div>
          </div>
          <i class="fa-solid fa-burger deal-icon"></i>
        </div>
        <div class="deal-card" data-deal="meals99">
          <div>
            <div class="deal-tag">Super Value</div>
            <div class="deal-title">Meals at ₹99 & Free Delivery</div>
          </div>
          <i class="fa-solid fa-star deal-icon"></i>
        </div>
      </div>
    </div>
  `;

  // Train PNR delivery banner
  const trainDeliveryHTML = `
    <div class="train-delivery-banner">
      <div class="train-banner-left">
        <div class="train-banner-icon"><i class="fa-solid fa-train"></i></div>
        <div class="train-banner-info">
          <h3>Mess Food Ahead?</h3>
          <p>Enjoy delicious delights on train, at 180+ stations</p>
        </div>
      </div>
      <div class="train-banner-right">
        <input type="text" id="train-pnr-input" placeholder="Enter 10-digit PNR (e.g. 1234567890)..." maxlength="10" />
        <button class="btn-pnr-submit" id="btn-pnr-submit">ENTER PNR</button>
      </div>
    </div>
  `;

  // Ninety Nine Store section
  const ninetyNineStoreHTML = `
    <div class="ninety-nine-store-section" id="ninety-nine-store-section">
      <div class="store-header">
        <div class="store-logo-wrapper">
          <span class="store-title-badge">99 store</span>
          <span class="store-subtitle">Meals at ₹99 + Free Delivery</span>
        </div>
        <span style="font-size:12px; color:var(--primary); font-weight:700; cursor:pointer;" id="btn-view-all-99">View All <i class="fa-solid fa-chevron-right"></i></span>
      </div>
      <div class="store-grid">
        ${ninetyNineStoreItems.map(item => {
          const cartItem = cart.find(ci => ci.id === item.id);
          const buttonHTML = cartItem
            ? `
              <div class="quantity-counter">
                <button class="counter-btn dec-store-item" data-item-id="${item.id}">-</button>
                <span class="counter-val" style="background:#fff; padding:0 8px;">${cartItem.quantity}</span>
                <button class="counter-btn inc-store-item" data-item-id="${item.id}">+</button>
              </div>
            `
            : `<button class="btn-store-add add-store-item" data-item-id="${item.id}">ADD</button>`;

          return `
            <div class="store-item-card">
              <img src="${item.image}" alt="${item.name}" class="store-item-img">
              <div class="store-item-details">
                <div>
                  <h4 class="store-item-name">${item.name}</h4>
                  <div class="store-item-rating">★ ${item.rating} (${item.ratingCount}) | ${item.restaurant}</div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; width:100%;">
                  <div class="store-item-price-wrapper">
                    <span class="store-item-price">₹${item.price}</span>
                    <span class="store-item-original">₹${item.originalPrice}</span>
                  </div>
                  ${buttonHTML}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Gourmet Restaurants List Grid (shows top 10 based on selected location)
  const filteredRestaurants = filterRestaurantsList();
  const topTenRestaurants = filteredRestaurants.slice(0, 10);
  
  let restaurantsHTML = '';
  if (topTenRestaurants.length === 0) {
    restaurantsHTML = `
      <div style="grid-column: span 3; text-align:center; padding: 48px; color: var(--text-muted);">
        <i class="fa-solid fa-utensils" style="font-size:48px; margin-bottom:16px; opacity:0.3;"></i>
        <p>No restaurants match your search or filter criteria in this location.</p>
      </div>
    `;
  } else {
    restaurantsHTML = topTenRestaurants.map(rest => {
      const offerText = rest.featured ? 'Upto 60% OFF' : 'Flat 20% OFF';
      const boltTagHTML = rest.isBolt 
        ? `<div class="bolt-tag"><i class="fa-solid fa-bolt"></i> Bolt | ${rest.deliveryTime}</div>` 
        : '';
      return `
        <div class="restaurant-card" data-rest-id="${rest.id}">
          <div class="restaurant-img-wrapper">
            <img src="${rest.image}" alt="${rest.name}">
            <div class="restaurant-offer-tag">${offerText}</div>
          </div>
          <div class="restaurant-details">
            <h3 class="restaurant-name">${rest.name}</h3>
            <div class="restaurant-meta">
              <span class="restaurant-rating ${rest.rating < 4.3 ? 'low-rating' : ''}">
                <i class="fa-solid fa-star"></i> ${rest.rating}
              </span>
              <span class="restaurant-time"><i class="fa-regular fa-clock"></i> ${rest.deliveryTime}</span>
              <span class="restaurant-cost">₹${rest.costForTwo} for two</span>
            </div>
            <p class="restaurant-cuisines">${rest.cuisines.join(', ')}</p>
            ${boltTagHTML}
          </div>
        </div>
      `;
    }).join('');
  }

  // Category Specific Dishes (Displays based on selected category, filtered by search)
  let categoryDishesHTML = '';
  if (activeFoodCategory !== 'none') {
    let dishes = [];
    let titleText = '';
    if (activeFoodCategory === 'all') {
      Object.keys(categoryDishes).forEach(key => {
        dishes = dishes.concat(categoryDishes[key]);
      });
      titleText = 'All Varieties';
    } else {
      dishes = categoryDishes[activeFoodCategory] || [];
      const catLabel = activeFoodCategory.charAt(0).toUpperCase() + activeFoodCategory.slice(1);
      titleText = `${catLabel} Varieties`;
    }

    // Filter dishes by search query
    if (searchQuery) {
      dishes = dishes.filter(d =>
        d.name.toLowerCase().includes(searchQuery) ||
        d.description.toLowerCase().includes(searchQuery)
      );
      titleText = `Search: "${searchQuery}"`;
    }

    const noResultsHTML = dishes.length === 0 ? `
      <div style="grid-column: span 3; text-align:center; padding: 48px; color: var(--text-muted);">
        <i class="fa-solid fa-magnifying-glass" style="font-size:48px; margin-bottom:16px; opacity:0.3;"></i>
        <p style="font-size:16px; font-weight:600;">No dishes found for "${searchQuery}"</p>
        <p style="font-size:13px; margin-top:6px;">Try searching: idli, dosa, coffee, chicken, biryani...</p>
      </div>
    ` : '';

    categoryDishesHTML = `
      <div class="section-header" style="margin-top: 20px;">
        <h2 class="section-title" style="text-transform: capitalize;">${titleText} (${dishes.length} items)</h2>
        <button class="filter-pill active" id="btn-back-to-all" style="border-radius: 8px; font-weight:700;"><i class="fa-solid fa-arrow-left"></i> Deals & Restaurants</button>
      </div>
      <div class="grocery-grid" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); margin-top:20px;">
        ${noResultsHTML}
        ${dishes.map(dish => {
          const cartItem = cart.find(ci => ci.id === dish.id);
          const buttonHTML = cartItem
            ? `
              <div class="quantity-counter">
                <button class="counter-btn dec-cat-dish" data-dish-id="${dish.id}" data-dish-cat="${activeFoodCategory}">-</button>
                <span class="counter-val" style="background:#fff; padding:0 8px;">${cartItem.quantity}</span>
                <button class="counter-btn inc-cat-dish" data-dish-id="${dish.id}" data-dish-cat="${activeFoodCategory}">+</button>
              </div>
            `
            : `<button class="btn-add-item add-cat-dish" data-dish-id="${dish.id}" data-dish-cat="${activeFoodCategory}">ADD</button>`;

          return `
            <div class="grocery-item-card" style="padding:14px; position:relative;">
              <div class="grocery-img-wrapper" style="height: 140px;">
                <img src="${dish.image}" alt="${dish.name}" style="height:100%; object-fit:cover;">
                <span class="veg-icon-tag ${dish.isVeg ? 'veg' : 'nonveg'}" style="position:absolute; top:8px; left:8px; background: rgba(255,255,255,0.95); box-shadow:var(--shadow-sm); z-index: 5;">
                  <i class="fa-solid ${dish.isVeg ? 'fa-leaf' : 'fa-circle'}"></i>
                </span>
              </div>
              <div style="margin-top:8px;">
                <h4 class="store-item-name" style="font-size:14px; min-height:40px; margin-bottom:2px;">${dish.name}</h4>
                <p style="font-size:11px; color:var(--text-muted); line-height:1.4; margin-bottom:8px; height:48px; overflow:hidden;">${dish.description}</p>
              </div>
              <div class="grocery-footer" style="margin-top:auto;">
                <span class="grocery-price">₹${dish.price}</span>
                ${buttonHTML}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Inject content
  if (activeFoodCategory === 'none') {
    container.innerHTML = `
      <!-- Best food options slider -->
      <div class="section-header" style="justify-content: center; margin-bottom: 16px;">
        <h2 class="section-title">Order our best food options</h2>
      </div>
      <div class="horizontal-slider" id="food-options-slider">
        ${optionsHTML}
      </div>

      <hr style="border:0; border-top: 1px solid var(--border-color); margin: 30px 0;">

      <!-- Purple Deals & Offers Section -->
      ${foodieVerseHTML}

      <!-- Train PNR Food Search Banner -->
      ${trainDeliveryHTML}

      <!-- 99 Store Deals Slider -->
      ${ninetyNineStoreHTML}

    `;
  } else {
    container.innerHTML = `
      <!-- Best food options slider -->
      <div class="section-header" style="justify-content: center; margin-bottom: 16px;">
        <h2 class="section-title">Order our best food options</h2>
      </div>
      <div class="horizontal-slider" id="food-options-slider">
        ${optionsHTML}
      </div>

      <hr style="border:0; border-top: 1px solid var(--border-color); margin: 30px 0;">

      <!-- Category Specific Menu Grid -->
      ${categoryDishesHTML}
    `;
  }

  // Highlight the active food category card in the options slider
  const activeCard = document.querySelector(`.food-option-card[data-food-id="${activeFoodCategory}"]`);
  if (activeCard) {
    activeCard.style.border = '2px solid var(--primary)';
    activeCard.style.borderRadius = '12px';
    activeCard.style.backgroundColor = 'var(--primary-light)';
  }

  // Food option category switcher listener
  document.querySelectorAll('.food-option-card').forEach(card => {
    card.addEventListener('click', () => {
      activeFoodCategory = card.dataset.foodId;
      renderFoodTab(document.getElementById('dynamic-content'));
    });
  });

  // Category specific UI listeners
  if (activeFoodCategory !== 'none') {
    document.getElementById('btn-back-to-all').addEventListener('click', () => {
      activeFoodCategory = 'none';
      renderFoodTab(document.getElementById('dynamic-content'));
    });

    // ADD category dish to cart
    document.querySelectorAll('.add-cat-dish').forEach(btn => {
      btn.addEventListener('click', () => {
        const dishId = btn.dataset.dishId;
        const dishCat = btn.dataset.dishCat;
        let dishes = [];
        if (dishCat === 'all') {
          Object.keys(categoryDishes).forEach(key => {
            dishes = dishes.concat(categoryDishes[key]);
          });
        } else {
          dishes = categoryDishes[dishCat] || [];
        }
        const dishItem = dishes.find(d => d.id === dishId);
        if (dishItem) addToCart(dishItem, 'food');
      });
    });

    document.querySelectorAll('.inc-cat-dish').forEach(btn => {
      btn.addEventListener('click', () => updateCartQuantity(btn.dataset.dishId, 1));
    });

    document.querySelectorAll('.dec-cat-dish').forEach(btn => {
      btn.addEventListener('click', () => updateCartQuantity(btn.dataset.dishId, -1));
    });
  } else {
    // Regular Food Tab listeners
    
    // Filter Pill Listeners
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderFoodTab(document.getElementById('dynamic-content'));
      });
    });

    // Deal card triggers
    document.querySelectorAll('.deal-card').forEach(card => {
      card.addEventListener('click', () => {
        const dealType = card.dataset.deal;
        if (dealType === 'feast') {
          appliedCoupon = 'FOODBUDS70';
          alert("🎉 Promo applied! Coupon code 'FOODBUDS70' (70% Off) will be added at checkout.");
        } else if (dealType === 'flat') {
          appliedCoupon = 'FOODBUDS150';
          alert("🎉 Promo applied! Coupon code 'FOODBUDS150' (Flat ₹150 Off) will be added at checkout.");
        } else if (dealType === 'bogo') {
          alert("🍔 Buy One Get One Deal activated! Make sure to add matching pairs in your cart.");
        } else if (dealType === 'meals99') {
          document.getElementById('ninety-nine-store-section').scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // PNR Search button listeners
    const submitPnr = () => {
      const input = document.getElementById('train-pnr-input');
      const pnr = input.value.trim();
      if (!/^\d{10}$/.test(pnr)) {
        alert("Please enter a valid 10-digit train PNR number.");
        return;
      }
      openPnrStationMenu(pnr);
    };

    document.getElementById('btn-pnr-submit').addEventListener('click', submitPnr);
    document.getElementById('train-pnr-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitPnr();
    });

    // 99 Store ADD item buttons
    document.querySelectorAll('.add-store-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.itemId;
        const storeItem = ninetyNineStoreItems.find(i => i.id === itemId);
        addToCart(storeItem, 'food');
      });
    });

    document.querySelectorAll('.inc-store-item').forEach(btn => {
      btn.addEventListener('click', () => updateCartQuantity(btn.dataset.itemId, 1));
    });

    document.querySelectorAll('.dec-store-item').forEach(btn => {
      btn.addEventListener('click', () => updateCartQuantity(btn.dataset.itemId, -1));
    });

    // View all 99 link click
    document.getElementById('btn-view-all-99').addEventListener('click', () => {
      alert("You are viewing the specialized 99 Store deals. Enjoy delicious meals under ₹99 + Free Delivery!");
    });

    // Restaurant card menu modal triggers
    document.querySelectorAll('.restaurant-card').forEach(card => {
      card.addEventListener('click', () => {
        const restId = card.dataset.restId;
        openRestaurantMenu(restId);
      });
    });
  }
}

// --- Filter Restaurants helper ---
function filterRestaurantsList() {
  let list = [...currentLocationRestaurants];

  // Search filter
  if (searchQuery) {
    list = list.filter(r => 
      r.name.toLowerCase().includes(searchQuery) || 
      r.cuisines.some(c => c.toLowerCase().includes(searchQuery))
    );
  }

  // Pill filters
  const activePill = document.querySelector('.filter-pill.active');
  if (activePill) {
    const filterId = activePill.id;
    if (filterId === 'filter-veg') {
      list = list.filter(r => r.isVeg);
    } else if (filterId === 'filter-rating') {
      list = list.filter(r => r.rating >= 4.4);
    } else if (filterId === 'filter-fast') {
      list = list.filter(r => parseInt(r.deliveryTime) <= 25);
    }
  }

  return list;
}

// --- INSTAMART TAB ---
function renderGroceryTab(container) {
  // Sidebar category listing
  const sidebarHTML = instamartCategories.map(cat => `
    <li class="grocery-category-item ${cat.id === activeGroceryCategory ? 'active' : ''}" data-cat-id="${cat.id}">
      ${cat.name}
    </li>
  `).join('');

  // --- Smart Grocery Search ---
  let filteredItems = [];
  let gridTitle = instamartCategories.find(c => c.id === activeGroceryCategory)?.name || 'Groceries';
  let isSearchResult = false;

  if (searchQuery) {
    // 1. Search across ALL grocery categories by item name
    const allGroceryItems = Object.entries(groceryItems).flatMap(([catId, items]) =>
      items.map(item => ({ ...item, _catId: catId }))
    );
    const nameMatches = allGroceryItems.filter(i =>
      i.name.toLowerCase().includes(searchQuery)
    );

    if (nameMatches.length > 0) {
      // Found items matching the name → show those
      filteredItems = nameMatches;
      gridTitle = `Results for "${searchQuery}"`;
      isSearchResult = true;
    } else {
      // No name match → show ALL items in the auto-switched category
      // (e.g. user typed "vegetables" → shows all veg items)
      filteredItems = groceryItems[activeGroceryCategory] || [];
      gridTitle = instamartCategories.find(c => c.id === activeGroceryCategory)?.name || 'Groceries';
    }
  } else {
    filteredItems = groceryItems[activeGroceryCategory] || [];
  }

  let gridHTML = '';
  if (filteredItems.length === 0) {
    gridHTML = `
      <div style="grid-column: span 3; text-align:center; padding: 48px; color: var(--text-muted);">
        <i class="fa-solid fa-basket-shopping" style="font-size:48px; margin-bottom:16px; opacity:0.3;"></i>
        <p style="font-size:16px; font-weight:600;">No items found for "${searchQuery}"</p>
        <p style="font-size:13px; margin-top:6px;">Try: tomato, milk, rice, almond, sunflower oil...</p>
      </div>
    `;
  } else {
    gridHTML = filteredItems.map(item => {
      const cartItem = cart.find(ci => ci.id === item.id);
      const actionButtonHTML = cartItem
        ? `
          <div class="quantity-counter">
            <button class="counter-btn dec-grocery" data-item-id="${item.id}">-</button>
            <span class="counter-val">${cartItem.quantity}</span>
            <button class="counter-btn inc-grocery" data-item-id="${item.id}">+</button>
          </div>
        `
        : `<button class="btn-add-item add-grocery" data-item-id="${item.id}">ADD</button>`;

      return `
        <div class="grocery-item-card">
          <div class="grocery-img-wrapper">
            <img src="${item.image}" alt="${item.name}">
          </div>
          <div>
            <h4 class="grocery-item-name">${item.name}</h4>
          </div>
          <div class="grocery-footer">
            <span class="grocery-price">₹${item.price}</span>
            ${actionButtonHTML}
          </div>
        </div>
      `;
    }).join('');
  }

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Shop groceries on Instamart</h2>
    </div>

    <!-- Category horizontal scroll header on mobile, sidebar on desktop -->
    <div class="instamart-layout">
      <aside class="instamart-sidebar">
        <ul class="grocery-category-list">
          ${sidebarHTML}
        </ul>
      </aside>
      <main>
        <h3 style="font-size:18px; margin-bottom:6px; text-transform:${isSearchResult ? 'none' : 'uppercase'};">
          ${gridTitle}
        </h3>
        ${isSearchResult ? `<p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''} found</p>` : `<p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">${filteredItems.length} items</p>`}
        <div class="grocery-grid">
          ${gridHTML}
        </div>
      </main>
    </div>
  `;


  // Attach Category Switching listeners
  document.querySelectorAll('.grocery-category-item').forEach(item => {
    item.addEventListener('click', () => {
      activeGroceryCategory = item.dataset.catId;
      renderGroceryTab(document.getElementById('dynamic-content'));
    });
  });

  // ADD grocery to cart
  document.querySelectorAll('.add-grocery').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.itemId;
      const allGroceryItems = Object.values(groceryItems).flat();
      const groceryItem = allGroceryItems.find(i => i.id === itemId);
      addToCart(groceryItem, 'grocery');
    });
  });

  // Quantity adjustments
  document.querySelectorAll('.inc-grocery').forEach(btn => {
    btn.addEventListener('click', () => updateCartQuantity(btn.dataset.itemId, 1));
  });

  document.querySelectorAll('.dec-grocery').forEach(btn => {
    btn.addEventListener('click', () => updateCartQuantity(btn.dataset.itemId, -1));
  });
}

// --- DINEOUT TAB ---
function renderDineoutTab(container) {
  let list = [...dineoutRestaurants];
  if (searchQuery) {
    list = list.filter(r => 
      r.name.toLowerCase().includes(searchQuery) || 
      r.cuisine.toLowerCase().includes(searchQuery) ||
      r.location.toLowerCase().includes(searchQuery)
    );
  }

  const dineoutHTML = list.map(rest => `
    <div class="dineout-card" data-dine-id="${rest.id}">
      <div class="dineout-img-wrapper">
        <img src="${rest.image}" alt="${rest.name}">
      </div>
      <div class="dineout-details">
        <h3 class="dineout-name">${rest.name}</h3>
        <div class="dineout-meta">
          <span class="dineout-rating"><i class="fa-solid fa-star"></i> ${rest.rating}</span>
          <span style="font-size:13px; font-weight:600; color:var(--text-muted)">₹${rest.costForTwo} for two</span>
        </div>
        <div class="dineout-info">
          <p><strong>Cuisine:</strong> ${rest.cuisine}</p>
          <p><i class="fa-solid fa-location-dot"></i> ${rest.location}</p>
        </div>
        <div class="dineout-offer-box">
          <span class="dineout-offer-text"><i class="fa-solid fa-percent"></i> ${rest.offer}</span>
        </div>
        <button class="dineout-book-btn" data-dine-id="${rest.id}">Book Table & Get Offer</button>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Discover best restaurants on Dineout</h2>
    </div>
    <div class="dineout-grid">
      ${dineoutHTML.length ? dineoutHTML : `
        <div style="grid-column: span 3; text-align:center; padding: 48px; color: var(--text-muted);">
          <i class="fa-solid fa-calendar-days" style="font-size:48px; margin-bottom:16px; opacity:0.3;"></i>
          <p>No dining venues match your search query.</p>
        </div>
      `}
    </div>
  `;

  // Attach booking click listeners
  document.querySelectorAll('.dineout-book-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dineId = btn.dataset.dineId;
      const venue = dineoutRestaurants.find(v => v.id === dineId);
      bookDineoutTable(venue);
    });
  });
}

// --- Book Dineout table action ---
function bookDineoutTable(venue) {
  if (!currentUser) {
    alert("Please sign in first to book tables at premium restaurants.");
    openModal('auth-modal');
    return;
  }

  // Quick interactive booking popup simulation
  const dateStr = new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const confirmBooking = confirm(`Confirm pre-booking at ${venue.name}?\n\nDate: Tomorrow (${dateStr})\nTime: 8:00 PM\nOffer: ${venue.offer}\n\nDo you want to secure this table?`);
  
  if (confirmBooking) {
    alert(`🎉 Table Booked Successfully!\n\nVenue: ${venue.name}\nBooking Code: SWG-DINE-${Math.floor(1000 + Math.random()*9000)}\n\nPresent this code at the restaurant to redeem your discount.`);
  }
}

function findRestaurantById(id) {
  if (!id) return null;
  return currentLocationRestaurants.find(r => r.id === id) || 
         restaurants.find(r => r.id === id) || 
         dineoutRestaurants.find(r => r.id === id);
}

// --- Cart Actions ---
function addToCart(item, type, restaurantId = null) {
  // Swiggy Check: mixing categories or restaurants
  if (cart.length > 0) {
    const firstItem = cart[0];
    if (firstItem.type !== type) {
      const confirmReset = confirm(`Your cart contains items from ${firstItem.type === 'food' ? 'Food Delivery' : 'Instamart'}.\nWould you like to discard those items and add this grocery?`);
      if (confirmReset) {
        cart = [];
      } else {
        return;
      }
    } else if (type === 'food' && firstItem.restaurantId !== restaurantId) {
      const prevRest = findRestaurantById(firstItem.restaurantId)?.name || 'another restaurant';
      const confirmReset = confirm(`Your cart contains dishes from ${prevRest}.\nDiscard cart and add dishes from ${findRestaurantById(restaurantId)?.name}?`);
      if (confirmReset) {
        cart = [];
      } else {
        return;
      }
    }
  }

  const existing = cart.find(ci => ci.id === item.id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      type: type,
      restaurantId: restaurantId,
      image: item.image
    });
  }

  saveCart();
  updateCartCount();
  renderActiveTab();
  // If menu modal is open, re-render its list
  if (document.getElementById('menu-modal').classList.contains('open')) {
    renderRestaurantMenuItems(findRestaurantById(restaurantId));
  }
}

function updateCartQuantity(itemId, change) {
  const itemIndex = cart.findIndex(ci => ci.id === itemId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += change;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
    saveCart();
    updateCartCount();
    renderActiveTab();
    renderCartDrawerList();
    
    // If menu modal is open, re-render
    const menuModal = document.getElementById('menu-modal');
    if (menuModal.classList.contains('open') && selectedRestaurant) {
      renderRestaurantMenuItems(selectedRestaurant);
    }
  }
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// --- Cart Drawer Rendering ---
function renderCartDrawerList() {
  const container = document.getElementById('cart-items-container');
  const priceSummary = document.getElementById('price-summary-box');
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <i class="fa-solid fa-bag-shopping cart-empty-icon"></i>
        <h4>Your Cart is Empty</h4>
        <p style="font-size:12px; margin-top:6px;">Good food is always cooking. Add some items to fill it up!</p>
      </div>
    `;
    priceSummary.style.display = 'none';
    return;
  }

  const listHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image || '/images/img_1.jpg'}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">₹${item.price} each</div>
      </div>
      <div class="quantity-counter" style="margin-right:12px;">
        <button class="counter-btn dec-cart-item" data-item-id="${item.id}">-</button>
        <span class="counter-val">${item.quantity}</span>
        <button class="counter-btn inc-cart-item" data-item-id="${item.id}">+</button>
      </div>
      <div class="cart-item-price">₹${item.price * item.quantity}</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="cart-item-list">
      ${listHTML}
    </div>
  `;

  // Attach quantity click listeners in drawer
  container.querySelectorAll('.inc-cart-item').forEach(btn => {
    btn.addEventListener('click', () => updateCartQuantity(btn.dataset.itemId, 1));
  });
  container.querySelectorAll('.dec-cart-item').forEach(btn => {
    btn.addEventListener('click', () => updateCartQuantity(btn.dataset.itemId, -1));
  });

  priceSummary.style.display = 'block';
  calculateCartTotals();
}

function calculateCartTotals() {
  const itemTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isFreeDelivery = cart.length > 0 && cart.every(item => item.id.startsWith('99-'));
  const deliveryPartnerFee = isFreeDelivery ? 0 : 40;
  const platformFee = 5;
  
  document.getElementById('price-items').textContent = `₹${itemTotal}`;
  document.getElementById('price-delivery').textContent = deliveryPartnerFee === 0 ? 'FREE' : `₹${deliveryPartnerFee}`;
  
  const discountRow = document.getElementById('coupon-discount-row');
  let discountVal = 0;
  
  if (appliedCoupon === 'FOODBUDS60' || appliedCoupon === 'SWIGGY60') {
    discountVal = Math.round(itemTotal * 0.6);
    document.getElementById('price-discount').textContent = `-₹${discountVal}`;
    discountRow.querySelector('span:first-child').textContent = `Coupon Discount (${appliedCoupon})`;
    discountRow.style.display = 'flex';
  } else if (appliedCoupon === 'FOODBUDS70') {
    discountVal = Math.round(itemTotal * 0.7);
    document.getElementById('price-discount').textContent = `-₹${discountVal}`;
    discountRow.querySelector('span:first-child').textContent = `Coupon Discount (FOODBUDS70)`;
    discountRow.style.display = 'flex';
  } else if (appliedCoupon === 'FOODBUDS150') {
    discountVal = Math.min(itemTotal, 150);
    document.getElementById('price-discount').textContent = `-₹${discountVal}`;
    discountRow.querySelector('span:first-child').textContent = `Coupon Discount (FOODBUDS150)`;
    discountRow.style.display = 'flex';
  } else {
    discountRow.style.display = 'none';
  }

  const grandTotal = Math.max(0, itemTotal - discountVal + deliveryPartnerFee + platformFee);
  document.getElementById('price-grand').textContent = `₹${grandTotal}`;
}

// --- Menu Modal View Open ---
function openRestaurantMenu(restId) {
  const rest = findRestaurantById(restId);
  if (!rest) return;

  selectedRestaurant = rest;
  
  // Set modal header details
  document.getElementById('menu-restaurant-name').textContent = rest.name;
  document.getElementById('menu-restaurant-cuisines').textContent = rest.cuisines.join(', ') + ` | ${rest.deliveryTime}`;
  document.getElementById('menu-hero-bg').style.backgroundImage = `url('${rest.image}')`;

  renderRestaurantMenuItems(rest);
  openModal('menu-modal');
}

function openPnrStationMenu(pnr) {
  // Mock resolving
  let info = trainStationRestaurants[pnr];
  if (!info) {
    // Generate simulated station for test PNRs
    const stationName = `Station Junction SBC (Resolving PNR ${pnr})`;
    info = {
      station: stationName,
      train: 'Shatabdi Express (12028)',
      restaurants: [
        { id: 'tr-1', name: 'Rail Diner - SBC Junction', cuisines: ['North Indian', 'Meals'], rating: 4.2, deliveryTime: '15 mins', costForTwo: 300, image: '/images/img_8.jpg' },
        { id: 'tr-2', name: 'Station Junction Foods', cuisines: ['Chinese', 'Fast Food'], rating: 3.9, deliveryTime: '20 mins', costForTwo: 200, image: '/images/img_12.jpg' }
      ]
    };
  }

  // Populate train station details
  document.getElementById('pnr-modal-info').innerHTML = `
    <strong>Train:</strong> ${info.train} <br>
    <strong>Station:</strong> ${info.station}
  `;

  const container = document.getElementById('pnr-restaurants-container');
  container.innerHTML = info.restaurants.map(rest => `
    <div class="pnr-rest-item">
      <img src="${rest.image}" alt="${rest.name}" class="pnr-rest-img">
      <div class="pnr-rest-info">
        <h4>${rest.name}</h4>
        <p>${rest.cuisines.join(', ')}</p>
        <div class="pnr-rest-meta">
          <span class="pnr-rest-rating">★ ${rest.rating}</span>
          <span>${rest.deliveryTime}</span>
          <span>₹${rest.costForTwo} for two</span>
        </div>
      </div>
      <button class="btn-pnr-submit btn-pnr-order" data-rest-id="${rest.id}" style="padding: 6px 12px; font-size:12px;">Order to Seat</button>
    </div>
  `).join('');

  openModal('pnr-modal');

  // Order to seat buttons
  container.querySelectorAll('.btn-pnr-order').forEach(btn => {
    btn.addEventListener('click', () => {
      const restId = btn.dataset.restId;
      closeModal('pnr-modal');
      
      // Ensure the restaurant details exist in main restaurants list so they can be loaded
      let restDetail = restaurants.find(r => r.id === restId);
      if (!restDetail) {
        // Mock menu details for Rail diners
        restDetail = {
          id: restId,
          name: restId === 'tr-1' ? 'Rail Diner - SBC Junction' : 'Station Junction Foods',
          image: restId === 'tr-1' ? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80' : 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80',
          rating: restId === 'tr-1' ? 4.2 : 3.9,
          deliveryTime: restId === 'tr-1' ? '15 mins' : '20 mins',
          costForTwo: restId === 'tr-1' ? 300 : 200,
          cuisines: restId === 'tr-1' ? ['North Indian', 'Meals'] : ['Chinese', 'Fast Food'],
          menu: [
            { id: restId + '-m1', name: 'Premium Veg Thali Combo', price: 150, description: 'Fresh Paneer Sabzi, Dal Tadka, Seasonal Mix Veg, Basmati Rice, 3 Butter Rotis, Raita, and Gulab Jamun.', image: '/images/img_16.jpg', isVeg: true },
            { id: restId + '-m2', name: 'Chinese Hakka Noodles Combo', price: 170, description: 'Wok-tossed noodles served with Veg Manchurian balls in hot sweet and sour garlic gravy.', image: '/images/img_17.jpg', isVeg: true }
          ]
        };
        restaurants.push(restDetail);
      }
      
      openRestaurantMenu(restId);
    });
  });
}

function renderRestaurantMenuItems(rest) {
  const container = document.getElementById('menu-items-body');
  
  // Render dishes grouped under category or direct listing
  const itemsHTML = rest.menu.map(item => {
    const isVegTag = item.isVeg ? '<span class="veg-icon-tag veg"><i class="fa-solid fa-leaf"></i> VEG</span>' : '<span class="veg-icon-tag nonveg"><i class="fa-solid fa-circle"></i> NON-VEG</span>';
    
    // Add/Qty actions
    const cartItem = cart.find(ci => ci.id === item.id);
    const actionHTML = cartItem
      ? `
        <div class="quantity-counter" style="position: absolute; bottom:-10px; left:50%; transform:translateX(-50%); z-index:5;">
          <button class="counter-btn dec-menu-qty" data-item-id="${item.id}" data-rest-id="${rest.id}">-</button>
          <span class="counter-val" style="background:#fff; padding:0 10px;">${cartItem.quantity}</span>
          <button class="counter-btn inc-menu-qty" data-item-id="${item.id}" data-rest-id="${rest.id}">+</button>
        </div>
      `
      : `<button class="menu-item-btn-add add-menu-item" data-item-id="${item.id}" data-rest-id="${rest.id}">ADD</button>`;

    return `
      <div class="menu-item-row">
        <div class="menu-item-info">
          ${isVegTag}
          <h4 class="menu-item-name">${item.name}</h4>
          <div class="menu-item-price">₹${item.price}</div>
          <p class="menu-item-desc">${item.description}</p>
        </div>
        <div class="menu-item-actions">
          <img src="${item.image}" alt="${item.name}" class="menu-item-img">
          ${actionHTML}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <h3 class="menu-category-title">Recommended Dishes (${rest.menu.length})</h3>
    ${itemsHTML}
  `;

  // Attach button event listeners
  container.querySelectorAll('.add-menu-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.itemId;
      const restId = btn.dataset.restId;
      const r = findRestaurantById(restId);
      const foodItem = r.menu.find(m => m.id === itemId);
      addToCart(foodItem, 'food', restId);
    });
  });

  container.querySelectorAll('.inc-menu-qty').forEach(btn => {
    btn.addEventListener('click', () => updateCartQuantity(btn.dataset.itemId, 1));
  });

  container.querySelectorAll('.dec-menu-qty').forEach(btn => {
    btn.addEventListener('click', () => updateCartQuantity(btn.dataset.itemId, -1));
  });
}

// --- Auth Modal Submit Flow ---
function handleAuthSubmit(e) {
  e.preventDefault();
  const fieldVal = document.getElementById('auth-phone').value;
  if (!fieldVal) return;

  // Simple username creation simulation from phone/email
  const mockName = fieldVal.includes('@') 
    ? fieldVal.split('@')[0] 
    : 'User_' + fieldVal.slice(-4);

  currentUser = {
    name: mockName,
    credentials: fieldVal
  };

  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  renderHeader();
  closeModal('auth-modal');

  // If user was prompted to login while checking out, open checkout modal directly!
  if (cart.length > 0 && document.getElementById('cart-drawer-backdrop').classList.contains('open')) {
    closeModal('cart-drawer-backdrop');
    openCheckoutWizard();
  }
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  renderHeader();
  alert("You have signed out successfully.");
}

// --- Checkout Wizard Open & Control ---
function openCheckoutWizard() {
  if (!currentUser) {
    alert("Please sign in first to place orders.");
    openModal('auth-modal');
    return;
  }

  activeCheckoutStep = 1;
  updateCheckoutWizardStep();
  openModal('checkout-modal');
}

function updateCheckoutWizardStep() {
  const step1Tab = document.getElementById('step-1-tab');
  const step2Tab = document.getElementById('step-2-tab');
  const stepAddress = document.getElementById('checkout-step-address');
  const stepPayment = document.getElementById('checkout-step-payment');
  const prevBtn = document.getElementById('btn-checkout-prev');
  const nextBtn = document.getElementById('btn-checkout-next');

  if (activeCheckoutStep === 1) {
    step1Tab.className = 'step-indicator active';
    step2Tab.className = 'step-indicator';
    stepAddress.className = 'checkout-section active';
    stepPayment.className = 'checkout-section';
    prevBtn.style.visibility = 'hidden';
    nextBtn.textContent = 'Proceed to Payment';
  } else {
    step1Tab.className = 'step-indicator completed';
    step2Tab.className = 'step-indicator active';
    stepAddress.className = 'checkout-section';
    stepPayment.className = 'checkout-section active';
    prevBtn.style.visibility = 'visible';
    
    const grandTotal = document.getElementById('price-grand').textContent;
    nextBtn.textContent = `Pay ${grandTotal} & Place Order`;
  }
}

function handleCheckoutNext() {
  if (activeCheckoutStep === 1) {
    // Save address values
    deliveryAddress.name = document.getElementById('chk-name').value;
    deliveryAddress.house = document.getElementById('chk-house').value;
    deliveryAddress.area = document.getElementById('chk-area').value;
    deliveryAddress.pin = document.getElementById('chk-pin').value;

    if (!deliveryAddress.name || !deliveryAddress.house || !deliveryAddress.area || !deliveryAddress.pin) {
      alert("Please fill all delivery address details.");
      return;
    }

    activeCheckoutStep = 2;
    updateCheckoutWizardStep();
  } else {
    // Place order execution
    closeModal('checkout-modal');
    runPaymentAndTrackingSimulation();
  }
}

// --- Payment & Tracking simulation ---
function runPaymentAndTrackingSimulation() {
  openModal('tracker-modal');
  
  // Show spinner processing
  const loadingState = document.getElementById('tracker-loading-state');
  const successState = document.getElementById('tracker-success-state');
  const liveState = document.getElementById('tracker-live-state');
  const closeBtn = document.getElementById('tracker-modal-close');

  loadingState.style.display = 'flex';
  successState.style.display = 'none';
  liveState.style.display = 'none';
  closeBtn.style.display = 'none';

  // 1. Process payment spinner (2 seconds)
  setTimeout(() => {
    loadingState.style.display = 'none';
    successState.style.display = 'flex';
    
    // Trigger success confetti pops
    triggerConfettiExplosion();
  }, 2000);
}

function startLiveDeliveryTracking() {
  const successState = document.getElementById('tracker-success-state');
  const liveState = document.getElementById('tracker-live-state');
  
  successState.style.display = 'none';
  liveState.style.display = 'block';

  // Reset timeline steps
  const stepPlaced   = document.getElementById('track-step-placed');
  const stepKitchen  = document.getElementById('track-step-kitchen');
  const stepDelivery = document.getElementById('track-step-delivery');
  const stepCompleted= document.getElementById('track-step-completed');

  stepPlaced.className   = 'timeline-step completed';
  stepKitchen.className  = 'timeline-step active';
  stepDelivery.className = 'timeline-step';
  stepCompleted.className= 'timeline-step';

  document.getElementById('tracker-eta').textContent = '25 Mins';

  // --- Real Leaflet Map Setup ---
  // Use Koramangala, Bangalore as restaurant; delivery ~1.2km away
  const restaurantCoords = [12.9352, 77.6245]; // Koramangala 5th Block
  const deliveryCoords   = [12.9279, 77.6271]; // Koramangala 8th Block (home)

  // Route waypoints (simulate path along road)
  const routePoints = [
    restaurantCoords,
    [12.9335, 77.6248],
    [12.9310, 77.6255],
    [12.9290, 77.6265],
    deliveryCoords
  ];

  // Destroy previous map instance if it exists
  const mapContainer = document.getElementById('live-map');
  if (mapContainer && mapContainer._leaflet_id) {
    window._deliveryMap.remove();
  }

  // Init map centered between the two points
  const map = L.map('live-map', { zoomControl: true, scrollWheelZoom: false }).setView(
    [(restaurantCoords[0] + deliveryCoords[0]) / 2, (restaurantCoords[1] + deliveryCoords[1]) / 2],
    15
  );
  window._deliveryMap = map;

  // OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="/images/img_369.jpg">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // Restaurant marker 🍽️
  const restIcon = L.divIcon({
    className: '',
    html: `<div style="background:#FF5200; color:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 3px 10px rgba(255,82,0,0.5); border:2px solid #fff;">🍽️</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
  L.marker(restaurantCoords, { icon: restIcon })
    .addTo(map)
    .bindPopup('<b>Restaurant</b><br>Preparing your order...')
    .openPopup();

  // Home delivery marker 🏠
  const homeIcon = L.divIcon({
    className: '',
    html: `<div style="background:#60B246; color:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 3px 10px rgba(96,178,70,0.5); border:2px solid #fff;">🏠</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
  L.marker(deliveryCoords, { icon: homeIcon })
    .addTo(map)
    .bindPopup('<b>Your Location</b><br>Delivery destination');

  // Draw route polyline
  const routeLine = L.polyline(routePoints, {
    color: '#FF5200',
    weight: 4,
    opacity: 0.8,
    dashArray: '8, 6'
  }).addTo(map);

  // Rider marker 🏍️ — starts at restaurant
  const riderIcon = L.divIcon({
    className: '',
    html: `<div id="rider-marker-inner" style="background:#1a1a2e; color:#fff; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 3px 12px rgba(0,0,0,0.4); border:3px solid #FF5200; animation: pulse-rider 1s infinite;">🏍️</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
  const riderMarker = L.marker(restaurantCoords, { icon: riderIcon, zIndexOffset: 1000 })
    .addTo(map)
    .bindPopup('<b>Delivery Rider</b><br>On the way!');

  // Animate rider along route waypoints
  let pointIndex = 0;
  function moveRiderToNext() {
    pointIndex++;
    if (pointIndex >= routePoints.length) return;
    riderMarker.setLatLng(routePoints[pointIndex]);
    map.panTo(routePoints[pointIndex], { animate: true, duration: 0.8 });
  }

  // Step 2: Kitchen done → Out for Delivery (4.5s)
  trackingTimer = setTimeout(() => {
    stepKitchen.className  = 'timeline-step completed';
    stepDelivery.className = 'timeline-step active';
    document.getElementById('tracker-eta').textContent = '12 Mins';
    moveRiderToNext(); // waypoint 1
    setTimeout(moveRiderToNext, 1200); // waypoint 2

    // Step 3: Delivered (4.5s more)
    trackingTimer = setTimeout(() => {
      stepDelivery.className  = 'timeline-step completed';
      stepCompleted.className = 'timeline-step active';
      document.getElementById('tracker-eta').textContent = 'Arrived!';
      moveRiderToNext(); // waypoint 3
      setTimeout(moveRiderToNext, 800); // final - home

      // Update rider popup
      setTimeout(() => {
        riderMarker.setLatLng(deliveryCoords);
        riderMarker.bindPopup('<b>Delivered! 🎉</b><br>Enjoy your meal!').openPopup();
        map.setView(deliveryCoords, 16, { animate: true });
      }, 900);

      setTimeout(() => {
        stepCompleted.className = 'timeline-step completed';
        document.getElementById('tracker-modal-close').style.display = 'block';
        cart = [];
        saveCart();
        updateCartCount();
        renderActiveTab();
      }, 1200);

    }, 4500);
  }, 4500);
}


// Confetti programmatical generator
function triggerConfettiExplosion() {
  const holder = document.getElementById('confetti-holder');
  holder.innerHTML = '';
  const colors = ['#FF5200', '#60B246', '#0096ff', '#FFD700', '#FF69B4', '#9C27B0'];
  
  for (let i = 0; i < 45; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 1.5 + 's';
    piece.style.width = Math.random() * 8 + 6 + 'px';
    piece.style.height = piece.style.width;
    holder.appendChild(piece);
  }
}

// --- Modal Helper Functions ---
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden'; // Lock background scroll
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  // Only unlock body overflow if no other modals are open
  if (!document.querySelector('.modal-backdrop.open') && !document.getElementById('cart-drawer-backdrop').classList.contains('open')) {
    document.body.style.overflow = 'auto';
  }

  // Clear timers if tracker modal closes
  if (id === 'tracker-modal' && trackingTimer) {
    clearTimeout(trackingTimer);
  }
}

// --- Attach DOM Event Listeners ---
function initEventListeners() {
  // Logo trigger returns to Food Tab and resets search
  document.getElementById('logo-btn').addEventListener('click', () => {
    activeTab = 'food';
    searchQuery = '';
    document.getElementById('hero-search-input').value = '';
    renderActiveTab();
  });

  // Location inputs triggers
  document.getElementById('location-trigger').addEventListener('click', () => {
    const loc = prompt("Enter your location:", "Koramangala, Bangalore");
    if (loc) {
      document.getElementById('current-location-text').textContent = loc;
      document.getElementById('hero-location-input').value = loc;
      fetchRealRestaurantsFromLocation(loc);
    }
  });

  document.getElementById('hero-location-input').addEventListener('change', (e) => {
    const loc = e.target.value;
    document.getElementById('current-location-text').textContent = loc;
    fetchRealRestaurantsFromLocation(loc);
  });

  // Tab Selection
  document.querySelectorAll('.tab-card').forEach(card => {
    card.addEventListener('click', () => {
      activeTab = card.dataset.tab;
      if (activeTab === 'grocery') {
        activeGroceryCategory = 'veg';
      }
      renderActiveTab();
    });
  });

  // ── GLOBAL SMART SEARCH: auto-switches TAB + CATEGORY from any tab ──
  document.getElementById('hero-search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();

    if (!searchQuery) {
      // Clear search → reset food category to all, stay on current tab
      activeFoodCategory = 'all';
      if (activeTab === 'grocery') {
        activeGroceryCategory = 'veg';
      }
      renderActiveTab();
      return;
    }


    // ── Priority 1: GROCERY keywords → switch to Instamart tab ──
    const groceryMap = {
      // Vegetables
      'vegetable': 'veg', 'veggie': 'veg', 'sabzi': 'veg', 'greens': 'veg',
      'tomato': 'veg', 'potato': 'veg', 'aloo': 'veg', 'onion': 'veg', 'pyaz': 'veg',
      'spinach': 'veg', 'palak': 'veg', 'broccoli': 'veg', 'carrot': 'veg',
      'capsicum': 'veg', 'cucumber': 'veg', 'kheera': 'veg',
      'garlic': 'veg', 'lahsun': 'veg', 'ginger': 'veg', 'adrak': 'veg',
      'mushroom': 'veg', 'eggplant': 'veg', 'baigan': 'veg', 'pumpkin': 'veg',
      'peas': 'veg', 'bhindi': 'veg', 'ladyfinger': 'veg', 'cabbage': 'veg',
      'cauliflower': 'veg', 'gobi': 'veg', 'coriander': 'veg', 'pudina': 'veg',
      // Fruits
      'fruit': 'fruit', 'apple': 'fruit', 'banana': 'fruit',
      'grape': 'fruit', 'strawberry': 'fruit', 'pineapple': 'fruit', 'papaya': 'fruit',
      'pomegranate': 'fruit', 'kiwi': 'fruit', 'avocado': 'fruit',
      'guava': 'fruit', 'cherry': 'fruit', 'peach': 'fruit', 'pear': 'fruit',
      'plum': 'fruit', 'litchi': 'fruit', 'dragonfruit': 'fruit',
      // Dairy
      'dairy': 'dairy', 'milk': 'dairy', 'butter': 'dairy', 'cheese': 'dairy',
      'paneer': 'dairy', 'curd': 'dairy', 'dahi': 'dairy', 'bread': 'dairy',
      'yogurt': 'dairy', 'cream': 'dairy', 'ghee': 'dairy',
      // Grains
      'grain': 'grain', 'rice': 'grain', 'basmati': 'grain', 'atta': 'grain',
      'wheat': 'grain', 'dal': 'grain', 'lentil': 'grain', 'oats': 'grain',
      'chana': 'grain', 'chickpea': 'grain', 'poha': 'grain', 'rava': 'grain',
      'semolina': 'grain', 'maida': 'grain', 'ragi': 'grain', 'millet': 'grain',
      // Masalas & Dry Fruits
      'masala': 'masala', 'spice': 'masala', 'mirch': 'masala',
      'turmeric': 'masala', 'haldi': 'masala', 'cumin': 'masala', 'jeera': 'masala',
      'pepper': 'masala', 'cinnamon': 'masala', 'cardamom': 'masala', 'elaichi': 'masala',
      'clove': 'masala', 'laung': 'masala', 'salt': 'masala', 'sugar': 'masala',
      'tea': 'masala', 'chai': 'masala', 'coffee powder': 'masala',
      'cashew': 'masala', 'almond': 'masala', 'raisin': 'masala',
      'pistachio': 'masala', 'walnut': 'masala', 'hing': 'masala', 'dry fruit': 'masala',
      // Oils
      'cooking oil': 'oil', 'sunflower oil': 'oil', 'olive oil': 'oil',
      'mustard oil': 'oil', 'sesame oil': 'oil', 'groundnut oil': 'oil',
      'coconut oil': 'oil', 'soyabean oil': 'oil', 'rice bran oil': 'oil'
    };

    // ── Priority 2: FOOD delivery keywords → switch to Food tab ──
    const foodMap = {
      'idli': 'idli', 'sambar': 'idli', 'chutney idli': 'idli',
      'dosa': 'dosa', 'masala dosa': 'dosa', 'uttapam': 'dosa',
      'vada': 'vada', 'medu vada': 'vada',
      'coffee': 'coffee', 'cafe': 'coffee', 'cappuccino': 'coffee',
      'latte': 'coffee', 'espresso': 'coffee', 'filter coffee': 'coffee',
      'cake': 'cake', 'pastry': 'cake', 'cheesecake': 'cake', 'tiramisu': 'cake',
      'paratha': 'paratha', 'parotta': 'paratha',
      'juice': 'juice', 'lemon juice': 'juice', 'sugarcane': 'juice',
      'non veg': 'nonveg', 'nonveg': 'nonveg',
      'chicken': 'nonveg', 'mutton': 'nonveg', 'kebab': 'nonveg',
      'biryani': 'nonveg', 'tandoori': 'nonveg', 'shawarma': 'nonveg',
      'burger': 'nonveg', 'fish fry': 'nonveg', 'prawn': 'nonveg'
    };

    // ── Priority 3: DINEOUT keywords → switch to Dineout tab ──
    const dineoutKeywords = [
      'dineout', 'dining', 'restaurant', 'buffet', 'table booking',
      'barbeque', 'truffles', 'toit', 'social', 'farzi', 'punjab grill',
      'mainland', 'windmill', 'bistro', 'fine dining', 'italian', 'continental'
    ];

    // Check grocery first (highest priority)
    let groceryMatch = null;
    for (const [keyword, catId] of Object.entries(groceryMap)) {
      if (searchQuery.includes(keyword) || (searchQuery.length >= 2 && keyword.startsWith(searchQuery))) {
        groceryMatch = catId;
        break;
      }
    }

    if (groceryMatch) {
      // → Switch to Instamart + correct grocery category
      activeTab = 'grocery';
      activeGroceryCategory = groceryMatch;
    } else {
      // Check food keywords
      let foodMatch = null;
      for (const [keyword, catId] of Object.entries(foodMap)) {
        if (searchQuery.includes(keyword) || (searchQuery.length >= 2 && keyword.startsWith(searchQuery))) {
          foodMatch = catId;
          break;
        }
      }

      if (foodMatch) {
        // → Switch to Food delivery + correct food category
        activeTab = 'food';
        activeFoodCategory = foodMatch;
      } else {
        // Check Dineout specific restaurant names (e.g. Hatti Kaapi, Bombay Kulfis, Empire, etc.)
        const hasDineoutMatch = dineoutRestaurants.some(r => 
          r.name.toLowerCase().includes(searchQuery) ||
          r.cuisine.toLowerCase().includes(searchQuery)
        );

        // Check Food Delivery restaurant names
        const allDeliveryRestaurants = [...currentLocationRestaurants, ...restaurants];
        const hasDeliveryMatch = allDeliveryRestaurants.some(r => 
          r.name.toLowerCase().includes(searchQuery) ||
          r.cuisines.some(c => c.toLowerCase().includes(searchQuery))
        );

        if (hasDineoutMatch) {
          // → Switch to Dineout tab to show matching restaurant card
          activeTab = 'dineout';
        } else if (hasDeliveryMatch) {
          // → Switch to Food tab and show restaurants grid
          activeTab = 'food';
          activeFoodCategory = 'none';
        } else {
          // Check dineout general keywords
          const dineMatch = dineoutKeywords.some(k => 
            searchQuery.includes(k) || (searchQuery.length >= 2 && k.startsWith(searchQuery))
          );
          if (dineMatch) {
            // → Switch to Dineout tab
            activeTab = 'dineout';
          } else {
            // No tab match → search across all food dishes
            activeTab = 'food';
            activeFoodCategory = 'all';
          }
        }
      }
    }



    renderActiveTab();
  });


  // Press Enter on search → scroll smoothly to results
  document.getElementById('hero-search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const resultsSection = document.getElementById('dynamic-content');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });


  // Cart Drawer open/close
  document.getElementById('cart-trigger').addEventListener('click', () => {
    renderCartDrawerList();
    openModal('cart-drawer-backdrop');
  });

  document.getElementById('cart-close-btn').addEventListener('click', () => {
    closeModal('cart-drawer-backdrop');
  });

  document.getElementById('cart-drawer-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'cart-drawer-backdrop') {
      closeModal('cart-drawer-backdrop');
    }
  });

  // Cart Checkout click
  document.getElementById('cart-checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) {
      alert("Your cart is empty. Add some items to checkout!");
      return;
    }
    openCheckoutWizard();
  });

  // Apply Coupon Click
  document.getElementById('btn-apply-coupon').addEventListener('click', () => {
    const code = document.getElementById('coupon-code-input').value.trim().toUpperCase();
    const msg = document.getElementById('coupon-message');
    if (code === 'FOODBUDS60' || code === 'SWIGGY60') {
      appliedCoupon = code;
      msg.textContent = `Coupon ${code} Applied! You saved 60% on item totals.`;
      msg.className = 'coupon-message success';
      calculateCartTotals();
    } else if (code === 'FOODBUDS70') {
      appliedCoupon = code;
      msg.textContent = 'Coupon Applied! Deal Feast 70% discount activated.';
      msg.className = 'coupon-message success';
      calculateCartTotals();
    } else if (code === 'FOODBUDS150') {
      appliedCoupon = code;
      msg.textContent = 'Coupon Applied! Flat ₹150 discount activated.';
      msg.className = 'coupon-message success';
      calculateCartTotals();
    } else if (code) {
      appliedCoupon = null;
      msg.textContent = 'Invalid coupon code.';
      msg.className = 'coupon-message error';
      calculateCartTotals();
    } else {
      appliedCoupon = null;
      msg.textContent = '';
      calculateCartTotals();
    }
  });

  // Modal Closures
  document.getElementById('auth-modal-close').addEventListener('click', () => closeModal('auth-modal'));
  document.getElementById('menu-modal-close').addEventListener('click', () => closeModal('menu-modal'));
  document.getElementById('checkout-modal-close').addEventListener('click', () => closeModal('checkout-modal'));
  document.getElementById('tracker-modal-close').addEventListener('click', () => closeModal('tracker-modal'));
  document.getElementById('pnr-modal-close').addEventListener('click', () => closeModal('pnr-modal'));

  // Auth toggle Form
  document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
  
  let registerMode = false;
  document.getElementById('auth-toggle-btn').addEventListener('click', () => {
    registerMode = !registerMode;
    const title = document.getElementById('auth-title');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    
    if (registerMode) {
      title.textContent = 'Create Account';
      toggleText.textContent = 'Already have an account?';
      toggleBtn.textContent = 'Sign In';
    } else {
      title.textContent = 'Sign In';
      toggleText.textContent = 'New to Food Buds?';
      toggleBtn.textContent = 'Create an account';
    }
  });

  // Checkout Wizard Actions
  document.getElementById('btn-checkout-prev').addEventListener('click', () => {
    if (activeCheckoutStep > 1) {
      activeCheckoutStep--;
      updateCheckoutWizardStep();
    }
  });

  document.getElementById('btn-checkout-next').addEventListener('click', handleCheckoutNext);

  // Payment Methods selection toggles
  document.querySelectorAll('.payment-card').forEach(pCard => {
    pCard.addEventListener('click', () => {
      document.querySelectorAll('.payment-card').forEach(p => p.classList.remove('active'));
      pCard.classList.add('active');
      
      const method = pCard.dataset.method;
      selectedPaymentMethod = method;
      
      // Toggle inputs
      document.getElementById('card-subform').style.display = method === 'card' ? 'block' : 'none';
      document.getElementById('upi-subform').style.display = method === 'upi' ? 'block' : 'none';
    });
  });

  // Live tracker initiation
  document.getElementById('btn-start-tracking').addEventListener('click', startLiveDeliveryTracking);

  // Dummy header links alerts
  document.getElementById('nav-corporate-btn').addEventListener('click', () => alert("Welcome to Food Buds Corporate Services portal. Customized food ordering solutions for businesses."));
  document.getElementById('nav-partner-btn').addEventListener('click', () => alert("Want to partner with Food Buds? Drop your details and our team will get back to you."));

  // About Us Modal toggles
  document.getElementById('footer-about-btn').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('about-modal');
  });
  document.getElementById('about-modal-close').addEventListener('click', () => closeModal('about-modal'));
}
