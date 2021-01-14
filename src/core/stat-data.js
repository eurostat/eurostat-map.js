import { json, csv } from "d3-fetch";
import { getEstatDataURL } from '../lib/eurostat-base';
import JSONstat from "jsonstat-toolkit";
import { csvToIndex, jsonstatToIndex } from '../lib/eurostat-map-util';

/**
 * A statistical dataset, to be used for a statistical map.
 * 
 * @param {*} config 
 */
export const statData = function (config) {

	//build stat data object
	const out = {};

	/**
	 * The statistical values, indexed by NUTS id.
	 * Each stat value is an object {value,status}.
	 */
	let _data_ = undefined;

	/**
	 * Return the stat value {value,status} from a nuts id.
	 * If no argument is specified, returns the entire index.
	 * @param {*} nutsId 
	 */
	out.get = (nutsId) => !nutsId? _data_ : _data_ ? _data_[nutsId] : undefined;

	/**
	 * Return the stat value from a nuts id.
	 * @param {*} nutsId 
	 */
	out.getValue = (nutsId) => { const s=out.get(nutsId); return s?s.value:undefined; };

	/**
	 * Set a stat value from a nuts id.
	 * 
	 * @param {*} nutsId 
	 * @param {*} stat The new statistical data. The format can be either {value:34.324,status:"e"} or a the value only.
	 */
	out.set = (nutsId, stat) => {
		_data_ = _data_ || {};
		const s = _data_[nutsId];
		if(s)
			if(stat.value) { s.value = stat.value; s.status = stat.status; }
			else s.value = isNaN(+stat)?stat:+stat;
		else
			_data_[nutsId] = stat.value? stat : {value:isNaN(+stat)?stat:+stat};
		return out;
	}

	/**
	 * Set statistical data, already indexed by nutsId.
	 * 
	 * @param {*} data Something like: { "PT":0.2, "LU":0.6, ...}, or with status: { "PT": {value:0.2, status:"e"}, "LU":0.6, ...}
	 */
	out.setData = (data) => {
		Object.keys(data).forEach( (nutsId) => out.set(nutsId, data[nutsId]) );
		return out;
	}



	/** Return all stat values as an array. This can be used to classify the values. */
	out.getArray = function() {
		return Object.values(_data_).map(s => s.value).filter(s => (s == 0 || s));
	}

	/** Return stat unique values. This can be used for categorical maps. */
	out.getUniqueValues = function() {
		return Object.values(_data_).map(s=>s.value).filter( (item, i, ar) => ar.indexOf(item) === i );
	}

	/** Get min value. */
	out.getMin = function() {
		return Object.values(_data_).map(s => s.value).filter(s => (s == 0 || s)).reduce((acc, v) => Math.min(acc, v), 0);
	}
	/** Get max value. */
	out.getMax = function() {
		return Object.values(_data_).map(s => s.value).filter(s => (s == 0 || s)).reduce((acc, v) => Math.max(acc, v), 0);
	}

	/** Check if the stat data is ready. */
	out.isReady = function() {
		return _data_ != undefined;
	}


	/** Some metadata */
	out.metadata = undefined;

	//a text for the statitics unit of measure, to be shown in the tooltip
	out.unitText_ = undefined;


	/**
	 * Retrieve stat data from remote data sources.
	 * 
	 * @param {*} nutsLvl 
	 * @param {*} callback 
	 */
	out.retrieveFromRemote = function (nutsLvl, lang, callback) {
		if (out.eurostatDatasetCode_) updateEurobase(nutsLvl, lang, callback);
		else if (out.csvURL_) updateCSV(callback);
		return out;
	}


	//TODO decompose into Eurobase/jsonstat and CSV types ?


	/**
	 * Eurobase/jsonstat data source
	 * See https://ec.europa.eu/eurostat/web/json-and-unicode-web-services/getting-started/rest-request
	*/

	/** The Eurobase dataset code */
	out.eurostatDatasetCode_ = undefined;
	/** The Eurobase code */
	out.filters_ = { lastTimePeriod: 1 };
	/** The precision (number of decimal places) */
	out.precision_ = 2;

	/**
	 * Return promise for Eurobase/jsonstat data.
	 */
	const getEurobasePromise = function(nutsLvl, lang) {
		//set precision
		out.filters_["precision"] = out.precision_;
		//select only required geo groups, depending on the specified nuts level
		out.filters_["geoLevel"] = nutsLvl + "" === "0" ? "country" : "nuts" + nutsLvl;
		//force filtering of euro-geo-aggregates
		out.filters_["filterNonGeo"] = 1;

		//retrieve stat data from Eurostat API
		return json(getEstatDataURL(out.eurostatDatasetCode_, out.filters_, lang))
	}

	//for eurobase statistical data to retrieve from Eurostat API
	const updateEurobase = function (nutsLvl, lang, callback) {
		//erase previous data
		_data_ = null;

		getEurobasePromise(nutsLvl, lang).then(
			function (data___) {

				//decode stat data
				const jsd = JSONstat(data___);

				//store jsonstat metadata
				out.metadata = {"label": jsd.label, "href": jsd.href, "source": jsd.source, "updated": jsd.updated, "extension": jsd.extension};
				out.metadata.time = jsd.Dimension("time").id[0];

				//index
				_data_ = jsonstatToIndex(jsd);
				//TODO: use maybe https://github.com/badosa/JSON-stat/blob/master/utils/fromtable.md to build directly an index ?

				callback();
		});
	}

	/**
	 * Return the time stamp of the jsonstat dataset.
	*/
	out.getTime = function () {
		const t = out.filters_.time;
		if (t) return t;
		if (!_data_) return;
		return out.metadata.time;
	};






	/**
	 * CSV data source
	*/

	/** The CSV file URL */
	out.csvURL_ = undefined;
	/** The CSV column with the NUTS ids */
	out.geoCol_ = "geo";
	/** The CSV column with the statistical values */
	out.valueCol_ = "value";

	/**
	 * Return promise for CSV data.
	 */
	const getCSVPromise = function(nutsLvl) {
		return csv(out.csvURL_)
	}

	//for statistical data to retrieve from CSV file
	const updateCSV = function (callback) {
		//erase previous data
		_data_ = null;

		//retrieve csv data
		getCSVPromise().then(
			function (data___) {

				//decode stat data
				_data_ = csvToIndex(data___, out.geoCol_, out.valueCol_);

				//store some metadata
				out.metadata = { "href": out.csvURL_ };

				callback();
		});
	}

	//override attribute values with config values
	if(config) for (let key in config) out[key+"_"] = config[key];

	return out;
}
