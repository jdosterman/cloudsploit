const async = require('async');
const helpers = require('../../../helpers/azure');

module.exports = {
    title: 'Application Gateway WAF is Enabled',
    category: 'Application Gateway',
    domain: 'Application Gateway',
    description: 'Ensure that Web Application (WAF) FireWall is enabled for Application Gateway',
    more_info: 'Azure Web Application Firewall (WAF) on Azure Application Gateway provides centralized protection of your web applications from common exploits and vulnerabilities. Web applications are increasingly targeted by malicious attacks that exploit commonly known vulnerabilities.',
    recommended_action: 'Modify application gateway and enable WAF.',
    link: 'https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/ag-overview',
    apis: ['applicationGateway:listAll'],

    run: function(cache, settings, callback) {
        const results = [];
        const source = {};
        const locations = helpers.locations(settings.govcloud);

        async.each(locations.applicationGateway, (location, rcb) => {
            var appGateways = helpers.addSource(cache, source, 
                ['applicationGateway', 'listAll', location]);

            if (!appGateways) return rcb();

            if (appGateways.err || !appGateways.data) {
                helpers.addResult(results, 3, 'Unable to query for Application Gateway: ' + helpers.addError(appGateways), location);
                return rcb();
            }

            if (!appGateways.data.length) {
                helpers.addResult(results, 0, 'No existing Application Gateway found', location);
                return rcb();
            } 
            
            for (let appGateway of appGateways.data) {
                if (!appGateway.id || !appGateway.sku.tier === "WAF_v2") continue;

                if (appGateway.webApplicationFirewallConfiguration && appGateway.webApplicationFirewallConfiguration.enabled 
                    && appGateway.webApplicationFirewallConfiguration.enabled === true) {
                    helpers.addResult(results, 0, 'Web Application FireWall is enabled for Application Gateway', location, appGateway.id);
                } else {
                    helpers.addResult(results, 2, 'Web Application FireWall is not enabled for Application Gateway', location, appGateway.id);
                } 
            }

            rcb();
        }, function() {
            callback(null, results, source);
        });
    }
};
