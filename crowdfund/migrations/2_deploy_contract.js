module.exports = function(deployer) {
  deployer.deploy(SmartPoolToken, 600000, "0xa34EDD0E0223C2151b8408E3043b2F6EDC564fcE", {gas: 1000000});
};
