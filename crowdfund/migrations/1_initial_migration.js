module.exports = function(deployer) {
  deployer.deploy(Migrations, {gas: 200000});
};
