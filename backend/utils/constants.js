export const roles = ['farmer', 'customer'];
export const districts = ['Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya'];
export const categories = ['Vegetables','Fruits','Rice & Grains','Spices','Coconut Products','Leafy Greens','Pulses','Herbs','Seeds','Organic Products','Dairy','Other Farm Products'];
export const methods = ['Conventional','Organic','Natural','Hydroponic','Other'];
export const qualities = ['Premium','Grade A','Grade B','Standard'];
export const units = ['kg','g','bundle','piece','dozen','bag','box'];
export const availability = ['Available','Low Stock','Sold Out','Upcoming Harvest'];
export const orderSteps = (method) => method === 'pickup' ? ['Pending','Confirmed','Preparing','Ready for Pickup','Completed'] : ['Pending','Confirmed','Preparing','Out for Delivery','Delivered','Completed'];
export const statuses = [...new Set([...orderSteps('pickup'), ...orderSteps('delivery'), 'Cancelled'])];
