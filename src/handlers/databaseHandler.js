const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false,
    define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
    }
});

const models = {};

const modelsPath = path.join(__dirname, '../models');
const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));

for (const file of modelFiles) {
    const model = require(path.join(modelsPath, file))(sequelize, Sequelize.DataTypes);
    models[model.name] = model;
}

Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

async function connectDatabase() {
    try {
        await sequelize.authenticate();
        console.log('📊 Database connection established successfully');
        
        await sequelize.sync({ alter: true });
        console.log('📊 Database synchronized successfully');
        
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        throw error;
    }
}

module.exports = {
    sequelize,
    connectDatabase,
    models
};
