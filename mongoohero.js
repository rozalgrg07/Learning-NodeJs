
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://gurungrozal07:<password>@cluster0.gwwp30z.mongodb.net/');

const Cat = mongoose.model('Cat', { name: String });

const kitty = new Cat({ name: 'Zildjian' });
kitty.save().then(() => console.log('meow'));
