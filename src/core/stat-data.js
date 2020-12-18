import { json, csv } from "d3-fetch";
import { getEstatDataURL } from '../lib/eurostat-base';
import JSONstat from "jsonstat-toolkit";
import { csvToIndex, jsonstatToIndex } from '../lib/eurostat-map-util';

/**
 * A statistical dataset, to be used for a statistical map.
 */
export const statData = function () {

	const out = {};

	out.datasetCode_ = "demo_r_d3dens";
	out.filters_ = { lastTimePeriod: 1 };
	out.precision_ = 2;
    out.csvDataSource_ = null; //TODO decompose CSV and jsonstat types?
    //TODO still needed? keep only index?
	out.statData_ = null;   //TODO: may use https://github.com/badosa/JSON-stat/blob/master/utils/fromtable.md ?
	out._statDataIndex;

	/**
	 * Return the stat value {value,status} from a nuts id, using the index.
	 * @param {*} nutsId 
	 */
	out.getStat = (nutsId) => out._statDataIndex ? out._statDataIndex[nutsId] : undefined;


	/**
	 * 
	 */
	out.buildIndex = function() {
		//index stat values by NUTS id.
		out._statDataIndex = {};
		for (const id in out.statData_) {
			const value = out.statData_[id];
			if (value.value != 0 && !value.value) continue;
			let v = value.value;
			if (!isNaN(+v)) { v = +v; value.value = +v; }
			out._statDataIndex[id] = value;
		}
	}

		/**
	 * Return promise for Nuts2JSON topojson data.
	 */
	out.getStatDataPromise = function(nutsLvl) {

		//set precision
		out.filters_["precision"] = out.precision_;
		//select only required geo groups, depending on the specified nuts level
		out.filters_["geoLevel"] = nutsLvl + "" === "0" ? "country" : "nuts" + nutsLvl;
		//force filtering of euro-geo-aggregates
		out.filters_["filterNonGeo"] = 1;

		//retrieve stat data from Eurostat API
		return json(getEstatDataURL(out.datasetCode_, out.filters_))
	}


	out.updateStatDataB = function (nutsLvl, callback) {

		//erase previous data
		out.statData_ = null;

		if (out.csvDataSource_ == null) {
			//for statistical data to retrieve from Eurostat API
			out.getStatDataPromise(nutsLvl).then(
				function (data___) {

					//decode stat data
					out.statData_ = jsonstatToIndex(JSONstat(data___));

					callback();
				});
		} else {
			//for statistical data to retrieve from custom CSV file

			//retrieve csv data
			csv(out.csvDataSource_.url).then(
				function (data___) {

					//decode stat data
					out.stat.statData_ = csvToIndex(data___, out.csvDataSource_.geoCol, out.csvDataSource_.valueCol);

					callback();
				});
		}
		return out;
	}


    return out;
}
