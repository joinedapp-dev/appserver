module.exports = function(sequelize, DataTypes) {
    return sequelize.define('User', {
	id: { 
	    type: DataTypes.INTEGER,
	    allowNull: false,
	    autoIncrement: true,
            primaryKey: true
	},
	signInId: {
	    type: DataTypes.STRING,
	    allowNull: false
	},
	signInType: {
	    type: DataTypes.ENUM('FACEBOOK', 'GOOGLE', 'TWITTER', 'LINKEDIN', 'EMAIL'),
	    allowNull: false
	},
	password: {
	    type: DataTypes.STRING,
	    allowNull: true
	}
    });	
};
    
