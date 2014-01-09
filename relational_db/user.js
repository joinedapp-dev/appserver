module.exports = function(sequelize, DataTypes) {
    return sequelize.define('User', {
	id: { 
	    type: DataTypes.INTEGER,
	    allowNull: false,
	    autoIncrement: true,
            primaryKey: true
	},
	email: {
	    type: DataTypes.STRING,
	    uniqueKey: true,
	    allowNull: false
	},
	password: {
	    type: DataTypes.STRING,
	    allowNull: false
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

