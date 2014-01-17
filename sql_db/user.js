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
	    type: DataTypes.ENUM('FACEBOOK', 'GOOGLE', 'TWITTER', 'EMAIL'),
	    allowNull: false
	},
	password: {
	    type: DataTypes.STRING,
	    allowNull: true
	}
    });	
};
    
/*

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Order", {
    coinbase_id: {type: DataTypes.STRING, unique: true, allowNull: false},
    amount: {type: DataTypes.FLOAT},
    time: {type: DataTypes.STRING, allowNull: false}
  });
};
*/

