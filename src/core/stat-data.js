import { json, csv } from "d3-fetch";
import { getEstatDataURL } from '../lib/eurostat-base';
import JSONstat from "jsonstat-toolkit";
import { csvToIndex, jsonstatToIndex } from '../lib/eurostat-map-util';

/**
 * A statistical dataset, to be used for a statistical map.
 * @param {*} opts 
 */
export const statData = function (opts) {
	opts = opts || { eurostatDatasetCode:"demo_r_d3dens" };

	const out = {};

	/**
	 * The statistical values, indexed by NUTS id.
	 * Each stat value is an object {value,status}.
	 */
	out.data_ = opts.data;

	/**
	 * Return the stat value {value,status} from a nuts id.
	 * @param {*} nutsId 
	 */
	out.get = (nutsId) => out.data_ ? out.data_[nutsId] : undefined;

	/**
	 * Return the stat value from a nuts id.
	 * @param {*} nutsId 
	 */
	out.getValue = (nutsId) => { const s=out.get(nutsId); return s?s.value:undefined; };

	/**
	 * Set a stat value from a nuts id.
	 * The format of the new stat can be either {value,status} or a the value only.
	 * 
	 * @param {*} nutsId 
	 * @param {*} stat 
	 */
	out.set = (nutsId, stat) => {
		out.data_ = out.data_ || {};
		const s = out.data_[nutsId];
		if(s)
			if(stat.value) { s.value = stat.value; s.status = stat.status; }
			else s.value = isNaN(+stat)?stat:+stat;
		else
			out.data_[nutsId] = stat.value? stat : {value:isNaN(+stat)?stat:+stat};
		return out;
	}

	/**
	 * Set statistical data, already indexed by nutsId.
	 * 
	 * @param {*} data Something like { "PT":0.2, "LU":0.6, ...}, or with status: { "PT": {value:0.2, status:"e"}, "LU":0.6, ...}
	 */
	out.setData = (data) => {
		Object.keys(data).forEach( (nutsId) => out.set(nutsId, data[nutsId]) );
		return out;
	}



	/**
	 * Return all stat values as an array.
	 * This can be used to classify the values.
	 */
	out.getArray = function() {
		return Object.values(out.data_).map(s => s.value).filter(s => (s == 0 || s));
	}

	/**
	 * Return stat unique values.
	 * This can be used for categorical maps.
	 */
	out.getUniqueValues = function() {
		return Object.values(out.data_).map(s=>s.value).filter( (item, i, ar) => ar.indexOf(item) === i );
	}

	/**
	 * Get max value.
	 */
	out.getMax = function() {
		return Object.values(out.stat().data_).map(s => s.value).filter(s => (s == 0 || s)).reduce((acc, v) => Math.max(acc, v), 0);
	}
	/**
	 * Get min value.
	 */
	out.getMin = function() {
		return Object.values(out.stat().data_).map(s => s.value).filter(s => (s == 0 || s)).reduce((acc, v) => Math.min(acc, v), 0);
	}




	/**
	 * Retrieve stat data from remote data sources.
	 * 
	 * @param {*} nutsLvl 
	 * @param {*} callback 
	 */
	out.updateB = function (nutsLvl, callback) {
		if (out.eurostatDatasetCode_) updateEurobase(nutsLvl, callback);
		else if (out.csvURL_) updateCSV(callback);
		return out;
	}


	//TODO decompose into Eurobase/jsonstat and CSV types ?


	/**
	 * Eurobase/jsonstat data source
	 * See https://ec.europa.eu/eurostat/web/json-and-unicode-web-services/getting-started/rest-request
	*/

	/** The Eurobase dataset code */
	out.eurostatDatasetCode_ = opts.eurostatDatasetCode_;
	/** The Eurobase code */
	out.filters_ = opts.filters || { lastTimePeriod: 1 };
	out.precision_ = opts.precision || 2;
	let jsonStatTime = undefined;

	/**
	 * Return promise for Eurobase/jsonstat data.
	 */
	const getEurobasePromise = function(nutsLvl) {
		//set precision
		out.filters_["precision"] = out.precision_;
		//select only required geo groups, depending on the specified nuts level
		out.filters_["geoLevel"] = nutsLvl + "" === "0" ? "country" : "nuts" + nutsLvl;
		//force filtering of euro-geo-aggregates
		out.filters_["filterNonGeo"] = 1;

		//retrieve stat data from Eurostat API
		return json(getEstatDataURL(out.eurostatDatasetCode_, out.filters_))
	}

	//for eurobase statistical data to retrieve from Eurostat API
	const updateEurobase = function (nutsLvl, callback) {
		//erase previous data
		out.data_ = null;

		getEurobasePromise(nutsLvl).then(
			function (data___) {

				//decode stat data
				const jsd = JSONstat(data___);
				//get time
				jsonStatTime = JSONstat(data___).Dimension("time").id[0];
				//index
				out.data_ = jsonstatToIndex(jsd);
				//TODO: use maybe https://github.com/badosa/JSON-stat/blob/master/utils/fromtable.md to build directly an index ?

				callback();
		});
	}

	/**
	 * Return the time stamp of the jsonstat dataset.
	*/
	out.getTime = function () {
		const t = out.filters_.time;
		if (t) return t;up
		if (!out.data_) return;
		return jsonStatTime;
	};






	/**
	 * CSV data source
	*/

	/** The CSV file URL */
	out.csvURL_ = opts.csvURL;
	/** The CSV column with the NUTS ids */
	out.geoCol_ = opts.geoCol || "geo";
	/** The CSV column with the statistical values */
	out.valueCol_ = opts.valueCol || "value";

	/**
	 * Return promise for CSV data.
	 */
	const getCSVPromise = function(nutsLvl) {
		return csv(out.csvURL_)
	}

	//for statistical data to retrieve from CSV file
	const updateCSV = function (callback) {
		//erase previous data
		out.data_ = null;

		//retrieve csv data
		getCSVPromise().then(
			function (data___) {
				//decode stat data
				out.data_ = csvToIndex(data___, out.geoCol_, out.valueCol_);
				callback();
		});
	}

	return out;
}