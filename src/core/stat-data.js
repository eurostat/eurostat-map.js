import { json } from "d3-fetch";
import { getEstatDataURL, flags } from '../lib/eurostat-base';

/**
 * A statistical dataset, to be used for a statistical map.
 */
export const statData = function () {

	const out = {};

	out.datasetCode_ = "demo_r_d3dens";
	out.filters_ = { lastTimePeriod: 1 };
	out.precision_ = 2;
    out.csvDataSource_ = null;
    //TODO still needed? keep only index?
	out.statData_ = null;   //TODO: may use https://github.com/badosa/JSON-stat/blob/master/utils/fromtable.md ?
	out._statDataIndex;

	/**
	 * Return the stat value {value,status} from a nuts id, using the index.
	 * @param {*} nutsId 
	 */
	out.getStat = (nutsId) => out._statDataIndex ? out._statDataIndex[nutsId] : undefined;



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



    return out;
}
