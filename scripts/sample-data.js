// Sample data for your potluck app
// You can use these API calls to populate your PostgreSQL database

const sampleData = {
  potluck: {
    name: "Holiday Potluck 2025",
    date: "2025-01-15",
    menuItems: [
      "Green Bean Casserole",
      "Mashed Potatoes", 
      "Turkey",
      "Stuffing",
      "Cranberry Sauce",
      "Apple Pie",
      "Pumpkin Pie",
      "Dinner Rolls",
      "Caesar Salad",
      "Sweet Potato Casserole"
    ]
  }
};

// API calls to create this data:
console.log('=== API Calls to Create Sample Data ===\n');

console.log('1. Create Potluck:');
console.log(`POST ${process.env.BACKEND_URL || 'your-backend-url'}/potlucks`);
console.log('Body:', JSON.stringify({
  name: sampleData.potluck.name,
  date: sampleData.potluck.date,
  menuItems: sampleData.potluck.menuItems
}, null, 2));

console.log('\n2. Or create potluck and items separately:');
console.log(`POST ${process.env.BACKEND_URL || 'your-backend-url'}/potlucks`);
console.log('Body:', JSON.stringify({
  name: sampleData.potluck.name,
  date: sampleData.potluck.date
}, null, 2));

console.log('\nThen for each menu item:');
sampleData.potluck.menuItems.forEach((dish, index) => {
  console.log(`POST ${process.env.BACKEND_URL || 'your-backend-url'}/potlucks/1/menu`);
  console.log(`Body: {"dish": "${dish}"}`);
});

console.log('\n3. Add sample guests:');
const sampleGuests = [
  { name: "John Smith", family_count: 2 },
  { name: "Sarah Johnson", family_count: 4 },
  { name: "Mike Wilson", family_count: 1 },
  { name: "Emily Davis", family_count: 3 }
];

sampleGuests.forEach(guest => {
  console.log(`POST ${process.env.BACKEND_URL || 'your-backend-url'}/potlucks/1/guests`);
  console.log(`Body:`, JSON.stringify(guest));
});

console.log('\n=== Or Use Your Frontend ===');
console.log('Just visit your deployed app and create data through the UI!');
console.log('This is much easier and tests that everything works properly.');