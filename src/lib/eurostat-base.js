/**
 *
 * Generic functions for eurostat statistics
 *
 * @author julien Gaffuri
 *
 */

export const fontFamilyDefault = "'Myriad Pro', Myriad, MyriadPro-Regular,'Myriad Pro Regular', MyriadPro, 'Myriad Pro', 'Liberation Sans','Nimbus Sans L', 'Helvetica Neue', vegur, Vegur, Helvetica, Arial, sans-serif";

//colors
//official colors for Eurostat logo and statistical domains
export const color = {
	logo: { gray: "#787878", blue: "#004494", yellow: "#FFF100" },
	theme: { genreg: "#466eb4", ecofin: "#af4b91", popsoc: "#e6a532", indtradserv: "#00a0e1", agrifish: "#7daf4b", trade: "#b93c46", transp: "#961e2d", envener: "#41afaa", scitech: "#d7642d" }
}


//REST API

export const getEstatRestDataURLBase = "https://ec.europa.eu/eurostat/wdds/rest/data/";

/**
 * Build URL to fetch data from eurobase REST API.
 * @param {string} datasetCode The Eurobase dataset code
 * @param {object=} filters The filter parameters as for example: {key:value,key:[value1,value2,value3]}
 * @param {number=} lang
 * @param {number=} format
 * @param {number=} version
 */
export const getEstatDataURL = function (datasetCode, filters, lang, format, version) {
	lang = lang || "en";
	format = format || "json";
	version = version || "2.1";
	var url = [];
	url.push(getEstatRestDataURLBase, "v", version, "/", format, "/", lang, "/", datasetCode, "?");
	if (filters)
		for (var param in filters) {
			var o = filters[param];
			if (Array.isArray(o))
				for (var i = 0; i < o.length; i++)
					url.push("&", param, "=", o[i]);
			else url.push("&", param, "=", o);
		}
	return url.join("");
};


//flags
export const flags = { b: "break in time series", c: "confidential", d: "definition differs, see metadata", e: "estimated", f: "forecast", n: "not significant", p: "provisional", r: "revised", s: "Eurostat estimate", u: "low reliability", z: "not applicable" }



//geo

//Official country order to be used in Eurostat dissemination
export const geoOrderedList = ["EU", "EU27_2019", "EU28", "EU27", "EU15", "EA", "EA19", "EA18", "NMS12", "EA17", "EA12", "BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE", "UK", "IS", "LI", "NO", "CH", "ME", "MK", "AL", "RS", "TR", "US", "JP", "MX"];
//comparison function to use to sort countries based on official order
export const geoComparisonEstatPublications = function (g1, g2) { return geoOrderedList.indexOf(g1) - geoOrderedList.indexOf(g2); };

//check if a country code is a geographic aggregate
export const isGeoAggregate = function (geo) {
	return geo.indexOf("EA") > -1 || geo.indexOf("EU") > -1 || geo.indexOf("NMS") > -1;
};

//comparison function to be used to sort country lists based on names.
export const geoComparison = function (geoToNameFun) {
	geoToNameFun = geoToNameFun || function (a) { return a; };
	return function (g1, g2) {
		if (isGeoAggregate(g1) && !isGeoAggregate(g2)) return 1;
		if (!isGeoAggregate(g1) && isGeoAggregate(g2)) return -1;
		var g1_ = geoToNameFun(g1);
		var g2_ = geoToNameFun(g2);
		return g1_.localeCompare(g2_);
	}
};

//conversion from country codes 3 to 2
export const countryCodes3To2 = { AUT: "AT", BEL: "BE", CHE: "CH", CYP: "CY", CZE: "CZ", DEU: "DE", EST: "EE", GRC: "EL", HRV: "HR", FRA: "FR", HUN: "HU", IRL: "IE", ISL: "IS", LTU: "LT", LUX: "LU", LVA: "LV", MKD: "MK", MLT: "MT", NLD: "NL", NOR: "NO", SVN: "SI", BGR: "BG", DNK: "DK", ESP: "ES", POL: "PL", ITA: "IT", PRT: "PT", ROU: "RO", ROM: "RO", SVK: "SK", FIN: "FI", SWE: "SE", GBR: "UK", TUR: "TR", MNE: "ME", SRB: "RS", USA: "US" };

//override country names, to shorter ones
export const overrideCountryNames = function (dict, lg) {
	lg = lg || "en";
	var data;
	if (dict.EA) dict.EA = { en: "Euro area", fr: "Zone euro", de: "Euroraum" }[lg];
	if (dict.EU) dict.EU = { en: "European Union", fr: "Union européenne", de: "Europäische Union" }[lg];
	if (dict.EEA) dict.EEA = { en: "European Economic Area", fr: "Espace économique européen", de: "Europäischer Wirtschaftsraum" }[lg];
	if (dict.DE) dict.DE = { en: "Germany", fr: "Allemagne", de: "Deutschland" }[lg];
	if (dict.MK) dict.MK = { en: "Macedonia (FYRM)", fr: "Macédoine", de: "Mazedonien" }[lg];//"Macedonia (FYRM)";
};



export const getMonthTXT = function (monthInt) {
	return monthInt <= 9 ? "0" + monthInt : "" + monthInt;
};




//get generic url parameters
export const getURLParameters = function () {
	var ps = {};
	var p = ["w", "s", "lvl", "time", "proj", "y", "clnb", "lg", "type"];
	for (var i = 0; i < p.length; i++)
		ps[p[i]] = getParameterByName(p[i]);
	return ps;
};

/**
 * @param {string} name
 * @returns {string}
 */
export const getParameterByName = function (name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return !results ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
};






/**
 * @template T
 * @param {Array.<T>} arr
 * @param {string} indexAtt
 * @returns {Object.<string, T>}
 */
export const index = function (arr, indexAtt) {
	var out = {};
	for (var i = 0, nb = arr.length; i < nb; i++) {
		var obj = arr[i];
		out[obj[indexAtt]] = obj;
	}
	return out;
};

/**
 * @template T
 * @param {Array.<T>} js
 * @param {string} indexColumn
 * @returns {Object.<string, Array.<T>>}
 */
export const indexMultiple = function (js, indexColumn) {
	var out = {};
	for (var i = 0, nb = js.length; i < nb; i++) {
		var obj = js[i];
		var list = out[obj[indexColumn]];
		if (!list)
			out[obj[indexColumn]] = [obj];
		else
			list.push(obj);
	}
	return out;
};

/**
 * [{id:"fsdf",val:"tralala"},{id:"154",val:"foo"}] to {fsdf:"tralala",154:"foo"}
 * @param {Array} array
 * @param {string} id
 * @param {string} val
 * @returns {Object}
 */
export const index1 = function (array, id, val) {
	var out = {};
	for (var i = 0, nb = array.length; i < nb; i++) {
		var o = array[i];
		out[o[id]] = o[val];
	}
	return out;
};

/**
 * {"1":"FULL","2":"EMPTY","3":"AVAILABLE","4":"NA"}
 * to
 * [{id:"1",label="FULL"},{id:"2",label="EMPTY"},{id:"3",label="AVAILABLE"},{id:"4",label="NA"}]
 * @param {Object.<string, string>} index
 * @returns {Array.<{id:string,label:string}>}
 */
export const index1ToIdLabel = function (index) {
	var out = [];
	var keys = Object.keys(index);
	for (var i = 0, nb = keys.length; i < nb; i++) {
		var id = keys[i];
		out.push({ id: id, label: index[id] });
	}
	return out;
};

//{key1="value1",key1="value1"} to {value1="key1",value2="key2"}
export const swap = function (obj) {
	var out = {};
	for (var prop in obj)
		if (obj.hasOwnProperty(prop))
			out[obj[prop]] = prop;
	return out;
};

//"a,b,c,d" to ["a","b","c","d"]
export const split = function (val) {
	return val.split(/,\s*/);
};

//"a,b,c,d" to "d"
export const extractLast = function (term) {
	return split(term).pop();
};

/**
 * @param{object} obj
 * @return {object}
 */
export const objectKeysToLowerCase = function (obj) {
	var key, keys = Object.keys(obj);
	var n = keys.length;
	var newobj = {};
	while (n--) {
		key = keys[n];
		newobj[key.toLowerCase()] = obj[key];
	}
	return newobj;
};

/**
 * @param {Array.<string>} array
 * @return {Array.<string>}
 */
export const arrayKeysToLowerCase = function (array) {
	var out = [];
	for (var i = 0, nb = array.length; i < nb; i++) {
		out.push(objectKeysToLowerCase(array[i]));
	}
	return out;
};

/**
 * @param{string} str
 * @return{string}
 */
/*capitaliseStr = function(str){
 return str.replace(/^[a-z]/, function(m){ return m.toUpperCase(); });
 };*/

//	the color input has to be EXACTLY 7 characters, like #08a35c
//	percent parameter is between -1.0 and 1.0
/*shadeColor = function(color, percent) {
 var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
 return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
 };*/

//	the color input has to be EXACTLY 7 characters, like #08a35c
//	p parameter is between 0 and 1.0
/*blendColors = function(c0, c1, p) {
 var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
 return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
 };*/

/*function numberWithSpaces(x) {
 return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
 };*/

/**
 * @param{string} string
 * @return{string}
 */
export const escapeRegExp = function (string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};

/**
 * @param {string} string
 * @param {string} find
 * @param {string} replace
 * @return {string}
 */
export const replaceAll = function (string, find, replace) {
	return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};

/**
 * @param {Array} x
 * @param {Array} y
 * @return {Array}
 */
export const unionArrays = function (x, y) {
	var obj = {}, i, nb;
	for (i = 0, nb = x.length; i < nb; i++) {
		var xi = x[i];
		obj[xi] = xi;
	}
	for (i = 0, nb = y.length; i < nb; i++) {
		var yi = y[i];
		obj[yi] = yi;
	}
	var res = [];
	for (var k in obj)
		if (obj.hasOwnProperty(k)) res.push(obj[k]);
	return res;
};

//{1:"fff",df:15} to ["fff",15]
export const objValuesToArrays = function (obj) {
	return Object.keys(obj).map(function (k) { return obj[k]; });
};

/**
 * @param{number} num
 * @return {string}
 */
export const numberWithSpaces = function (num) {
	var str = num.toString().split('.');
	if (str[0].length >= 5)
		str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, "$1 ");
	if (str[1] && str[1].length >= 5)
		str[1] = str[1].replace(/(\d{3})/g, "$1 ");
	return str.join('.');
};



export function preventDefault(e) {
	e = e || window.event;
	if (e.preventDefault) e.preventDefault();
	e.returnValue = false;
}

export const disableScrolling = function () {
	if (window.addEventListener)
		window.addEventListener('DOMMouseScroll', preventDefault, false);
	window.onmousewheel = document.onmousewheel = preventDefault;
};

export const enableScrolling = function () {
	if (window.removeEventListener)
		window.removeEventListener('DOMMouseScroll', preventDefault, false);
	window.onmousewheel = document.onmousewheel = null;
};





//From https://code.google.com/p/stringencoders/source/browse/trunk/javascript/base64.js
export const encodeBase64 = function (s) {
	if (arguments.length !== 1) {
		throw new SyntaxError("Not enough arguments");
	}

	var getbyte = function (s, i) {
		var x = s.charCodeAt(i);
		if (x > 255) {
			console.log("Error");
			return null;
		}
		return x;
	};

	var padchar = '=';
	var alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	var i, b10;
	var x = [];

	// convert to string
	s = '' + s;

	var imax = s.length - s.length % 3;

	if (s.length === 0) {
		return s;
	}
	for (i = 0; i < imax; i += 3) {
		b10 = (getbyte(s, i) << 16) | (getbyte(s, i + 1) << 8) | getbyte(s, i + 2);
		x.push(alpha.charAt(b10 >> 18));
		x.push(alpha.charAt((b10 >> 12) & 0x3F));
		x.push(alpha.charAt((b10 >> 6) & 0x3f));
		x.push(alpha.charAt(b10 & 0x3f));
	}
	switch (s.length - imax) {
		case 1:
			b10 = getbyte(s, i) << 16;
			x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
				padchar + padchar);
			break;
		case 2:
			b10 = (getbyte(s, i) << 16) | (getbyte(s, i + 1) << 8);
			x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
				alpha.charAt((b10 >> 6) & 0x3f) + padchar);
			break;
	}
	return x.join('');
};

export const getPropName = function (obj) {
	for (var name in obj) { return name; }
};


/**
 * Returns max size
 * @return {object}
 */
export const getMaxSize = function () {
	var w = window,
		e = document.documentElement,
		g = document.getElementsByTagName("body")[0];
	return {
		width: w.innerWidth || e.clientWidth || g.clientWidth,
		height: w.innerHeight || e.clientHeight || g.clientHeight
	};
};

//transform 1 into 1st, 2 into 2nd, 3 into 3rd, etc...
export const getNumbered = function (number, lg) {
	lg = lg || "en";
	switch (lg) {
		case "fr":
			switch (number) {
				case 1: return "1er";
				default: return number + "ème";
			}
		default:
			switch (number) {
				case 1: return "1st";
				case 2: return "2nd";
				case 3: return "3rd";
				default: return number + "th";
			}
	}
};


/**
 * Returns browser language
 * @return {string}
 */
export const getLang = function () {
	return navigator.language || navigator.languages[0] || navigator.browserLanguage;
};

/**
 * Returns 2 chars language code
 * @return {string}
 */
export const getLang2Chars = function () {
	var lg = getParameterByName("lang") || getLang() || "en";
	return lg.substring(0, 2);
};


/**
 * @param mls
 * @return{Array.<Array.<number>>|null}
 */
export const getEnvelope = function (mls) {
	if (!mls) return null;
	//to be extended - supports only multiline strings
	var latMin = 99999, lonMin = 99999, latMax = -99999, lonMax = -99999;
	for (var i = 0; i < mls.coordinates.length; i++) {
		var cs = mls.coordinates[i];
		for (var j = 0; j < cs.length; j++) {
			var c = cs[j];
			if (c[0] > lonMax) lonMax = c[0];
			if (c[0] < lonMin) lonMin = c[0];
			if (c[1] > latMax) latMax = c[1];
			if (c[1] < latMin) latMin = c[1];
		}
	}
	if (latMin == 99999 || lonMin == 99999 || latMax == -99999 || lonMax == -99999) return null;
	return [[latMin, lonMin], [latMax, lonMax]];
};



export const serializeXmlNode = function (xmlNode) {
	if (typeof window.XMLSerializer != "undefined") {
		return (new window.XMLSerializer()).serializeToString(xmlNode);
	} else if (typeof xmlNode.xml != "undefined") {
		return xmlNode.xml;
	}
	return "";
};

/**
 * @param{number} cX
 * @param{number} cY
 * @param{number} radius
 * @param{number} aDeg
 * @return {{x:number, y:number}}
 */
export const polarToCartesian = function (cX, cY, radius, aDeg) {
	var aRad = aDeg * Math.PI / 180.0;
	return {
		x: cX + radius * Math.cos(aRad),
		y: cY + radius * Math.sin(aRad)
	};
};



/**
 * build random colors index based on unique values.
 *
 * @param{Object.<string, {}>} index
 * @param{Object.<string,string>=} forceValues
 * @return{Object.<string,string>}
 */
export const getRandomColorsLegend = function (index, forceValues) {
	forceValues = forceValues || {};
	var values = Object.keys(index);
	var colI = {};
	for (var i = 0; i < values.length; i++) {
		var val = values[i];
		var col = forceValues[val];
		if (col)
			colI[val] = col;
		else
			colI[val] = colorbrewer.Set1[9][i % 9];
		//colI[val] = colorbrewer.Set3[12][i%12];
	}
	return colI;
};
