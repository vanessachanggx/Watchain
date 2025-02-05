const Watchain = artifacts.require("Watchain");

module.exports = function (deployer) {
    deployer.deploy(Watchain);
};