// javascript-mobile-desktop-geolocation
// https://github.com/estebanav/javascript-mobile-desktop-geolocation
//
// Copyright J. Esteban Acosta Villafañe
// Licensed under the MIT licenses.
//
// Based on Stan Wiechers > geo-location-javascript v0.4.8 > http://code.google.com/p/geo-location-javascript/
//
// Revision: $Rev: 01 $:
// Author: $Author: estebanav $:
// Date: $Date: 2012-09-07 23:03:53 -0300 (Fri, 07 Sep 2012) $:
//


var geoPosition = function() {

  var pub = {};
  var provider = null;
  var u = "undefined";
  var ipGeolocationSrv = 'http://freegeoip.net/json/?callback=JSONPCallback';

  pub.getCurrentPosition = function(success, error, opts) {
    provider.getCurrentPosition(success, error, opts);
  }

  pub.jsonp = {
    callbackCounter: 0,

    fetch: function(url, callback) {
      var fn = 'JSONPCallback_' + this.callbackCounter++;
      window[fn] = this.evalJSONP(callback);
      url = url.replace('=JSONPCallback', '=' + fn);

      var scriptTag = document.createElement('SCRIPT');
      scriptTag.src = url;
      document.getElementsByTagName('HEAD')[0].appendChild(scriptTag);
    },

    evalJSONP: function(callback) {
      return function(data) {
        callback(data);
      }
    }
  };

  pub.confirmation = function() {
    return confirm('This Webpage wants to track your physical location.\nDo you allow it?');
  };

  pub.init = function() {
    try {
      var hasGeolocation = typeof(navigator.geolocation) != u;
      if (!hasGeolocation) {
        if (!pub.confirmation()) {
          return false;
        }
      }

      if ((typeof(geoPositionSimulator) != u) && (geoPositionSimulator.length > 0)) {
        provider = geoPositionSimulator;
      // } else if (typeof(bondi) != u && typeof(bondi.geolocation) != u) {
      //   provider = bondi.geolocation;
      } else if (hasGeolocation) {
        provider = navigator.geolocation;
        pub.getCurrentPosition = function(success, error, opts) {
          function _success(p) {
            //for mozilla geode,it returns the coordinates slightly differently
            var params;
            if (typeof(p.latitude) != u) {
              params = {
                timestamp: p.timestamp,
                coords: {
                  latitude: p.latitude,
                  longitude: p.longitude
                }
              };
            } else {
              params = p;
            }
            success(params);
          }
          provider.getCurrentPosition(_success, error, opts);
        }

      } else if (typeof(device) != u && typeof(device.getServiceObject) != u) {
        provider = device.getServiceObject("Service.Location", "ILocation");

        //override default method implementation
        pub.getCurrentPosition = function(success, error, opts) {
          function callback(transId, eventCode, result) {
            if (eventCode == 4) {
              error({
                message: "Position unavailable",
                code: 2
              });
            } else {
              //no timestamp of location given?
              success({
                timestamp: null,
                coords: {
                  latitude: result.ReturnValue.Latitude,
                  longitude: result.ReturnValue.Longitude,
                  altitude: result.ReturnValue.Altitude,
                  heading: result.ReturnValue.Heading
                }
              });
            }
          }
          //location criteria

          var criteria = new Object();
          criteria.LocationInformationClass = "BasicLocationInformation";
          //make the call
          provider.ILocation.GetLocation(criteria, callback);
        }
      } else {
        pub.getCurrentPosition = function(success, error, opts) {
          pub.jsonp.fetch(ipGeolocationSrv,
            function(p) {
              success({
                timestamp: p.timestamp,
                coords: {
                  latitude: p.latitude,
                  longitude: p.longitude,
                  heading: p.heading
                }
              });
            });
        }
        provider = true;
      }
    } catch (e) {
      if (typeof(console) != u) console.log(e);
      return false;
    }
    return provider != null;
  }
  return pub;
}();
