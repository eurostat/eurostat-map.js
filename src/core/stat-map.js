import { json, csv } from "d3-fetch";
import JSONstat from "jsonstat-toolkit";
import { getEstatDataURL, flags } from '../lib/eurostat-base';
import { csvToIndex, jsonstatToIndex } from '../lib/eurostat-map-util';
import * as mt from './map-template';
import * as sd from './stat-data';


/**
 * An abstract statistical map: A map template with statistical data, without any particular styling rule.
 * 
 * @param {*} withCenterPoints Set to true (or 1) to add regions center points to the map template, to be used for proportional symbols maps for example.
 */
export const statMap = function (withCenterPoints) {
	//TODO decompose it: extract map template, extract statData. Enable several statData (as dict).

	const out = mt.mapTemplate(withCenterPoints);




	//TODO move that to stat-data - make array here

	//stat data
	out.datasetCode_ = "demo_r_d3dens";
	out.filters_ = { lastTimePeriod: 1 };
	out.precision_ = 2;
	out.csvDataSource_ = null;
	out.statData_ = null;   //TODO: may use https://github.com/badosa/JSON-stat/blob/master/utils/fromtable.md ?
	/**
	 * Statistical data, indexed by nuts id.
	 */
	out._statDataIndex;

	/**
	 * Return the stat value {value,status} from a nuts id, using the index.
	 * @param {*} nutsId 
	 */
	out.getStat = (nutsId) => out._statDataIndex ? out._statDataIndex[nutsId] : undefined;






	//legend
	out.showLegend_ = false;
	out.legend_ = undefined;

	//other
	out.noDataText_ = "No data available";
	out.lg_ = "en";
	out.transitionDuration_ = 800;


	//for maps using special fill patterns, this is the function to define them in the SVG image
	//	See as-well: getFillPatternLegend and getFillPatternDefinitionFun
	out.filtersDefinitionFun_ = function () { };

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	for (const att in out)
		out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };

	//override legend accesor
	// out.legend = function (v) {
	// 	for (let key in v) {
	// 		out.legend_[key] = v[key];
	// 	}
	// 	return out;
	// };



	/**
	 * Build a map object.
	 * This method should be called once, preferably after the map attributes have been set to some initial values.
	 */
	out.build = function () {

		out.buildMapTemplateBase();

		//add additional filters for fill patterns for example
		out.filtersDefinitionFun_(out.svg(), out.clnb_);

		//legend element
		if (out.showLegend()) {
			//create legend element
			const lg = out.legend_;
			const lgg = out.svg().append("g").attr("id", lg.gId_);
			lg.build();

			//set position
			//TODO this need to be changed when abandonning d3-legend dependancy
			const dx = out.width() - lg.width;
			const dy = lg.boxPadding + lg.titleFontSize;
			lgg.attr("transform", "translate(" + dx + "," + dy + ")");
		}

		//set tooltip text
		out.tooltipText( tooltipTextDefaultFunction );

		//retrieve geo data
		out.updateGeoData();

		//retrieve stat data
		out.updateStatData();

		return out;
	};


	/**
	 * Update the map with new geo data.
	 * This method should be called after attributes related to the map geometries have changed, to retrieve this new data and refresh the map.
	 */
	out.updateGeoData = function () {

		//erase previous data
		out._geoData = null;

		//get geo data from Nuts2json API
		json(out.nuts2jsonBaseURL_ + out.NUTSyear_ + (out.geo_ === "EUR" ? "" : "/" + this.geo_) + "/" + out.proj_ + "/" + out.scale_ + "/" + out.nutsLvl_ + ".json")
			.then(function (geo___) {
				out._geoData = geo___;

				//build map template
				out.buildMapTemplate();

				//if statistical figures are available, update the map with these values
				if (!out.statData_) return;
				out.updateStatValues();
			});
		return out;
	}





	/**
	 * Update the map with new stat data sources.
	 * This method should be called after specifications on the stat data sources attached to the map have changed, to retrieve this new data and refresh the map.
	 */
	out.updateStatData = function () {

		//erase previous data
		out.statData_ = null;

		if (out.csvDataSource_ == null) {
			//for statistical data to retrieve from Eurostat API

			//set precision
			out.filters_["precision"] = out.precision_;
			//select only required geo groups, depending on the specified nuts level
			out.filters_["geoLevel"] = out.nutsLvl_ + "" === "0" ? "country" : "nuts" + out.nutsLvl_;
			//force filtering of euro-geo-aggregates
			out.filters_["filterNonGeo"] = 1;

			//retrieve stat data from Eurostat API
			json(getEstatDataURL(out.datasetCode_, out.filters_)).then(
				function (data___) {

					//decode stat data
					out.statData_ = jsonstatToIndex(JSONstat(data___));

					//if geodata are already there, refresh the map with stat values
					if (!out._geoData) return;
					out.updateStatValues();
				});
		} else {
			//for statistical data to retrieve from custom CSV file

			//retrieve csv data
			csv(out.csvDataSource_.url).then(
				function (data___) {

					//decode stat data
					out.statData_ = csvToIndex(data___, out.csvDataSource_.geoCol, out.csvDataSource_.valueCol);

					//if geodata are already there, refresh the map with stat values
					if (!out._geoData) return;
					out.updateStatValues();
				});
		}
		return out;
	}




	/**
	 * Update the map with new stat data.
	 * This method should be called after stat data attached to the map have changed, to refresh the map.
	 * If the stat data sources have changed, call *updateStatData* instead.
	 */
	out.updateStatValues = function () {

		//index stat values by NUTS id.
		out._statDataIndex = {};
		for (const id in out.statData_) {
			const value = out.statData_[id];
			if (value.value != 0 && !value.value) continue;
			let v = value.value;
			if (!isNaN(+v)) { v = +v; value.value = +v; }
			out._statDataIndex[id] = value;
		}

		//update classification and styles
		out.updateClassification();
		out.updateStyle();

		//update legend, if any
		if (out.legend_) out.legend().update();

		return out;
	}

	/**
	 * Abstract method.
	 * Update the map after classification attributes have been changed.
	 * For example, if the number of classes, or the classification method has changed, call this method to update the map.
	 */
	out.updateClassification = function () {
		console.log("Map updateClassification function not implemented")
		return out;
	}


	/**
	 * Abstract method.
	 * Update the map after styling attributes have been changed.
	 * For example, if the style (color?) for one legend element has changed, call this method to update the map.
	 */
	out.updateStyle = function () {
		console.log("Map updateStyle function not implemented")
		return out;
	}



	/**
	 * Retrieve the time stamp of the map, even if not specified in the dimension initially.
	 * This applies only for stat data retrieved from Eurostat API.
	 * This method is useful for example when the data retrieved is the freshest, and one wants to know what this date is, for example to display it in the map title.
	*/
	out.getTime = function () {
		const t = out.filters_.time;
		if (t) return t;
		//TODO extract generic part
		if (!out.statData_) return;
		t = out.statData_.Dimension("time");
		if (!t || !t.id || t.id.length == 0) return;
		return t.id[0]
	};


	/**
	 * Set some map attributes based on the following URL parameters:
	 * "w":width, "h":height, "x":xGeoCenter, "y":yGeoCenter, "z":pixGeoSize, "s":scale, "lvl":nuts level, "time":time,
	 * "proj":CRS, "geo":geo territory, "ny":nuts version, "lg":langage, "sl":show legend, "clnb":class number
	 */
	out.setFromURL = function () {
		const opts = getURLParameters();
		if (opts.w) out.width(opts.w);
		if (opts.h) out.height(opts.h);
		if (opts.x && opts.y) out.geoCenter([opts.x, opts.y]);
		if (opts.z) out.pixSize(opts.z);
		if (opts.s) out.scale(opts.s);
		if (opts.lvl) out.nutsLvl(opts.lvl);
		if (opts.time) { out.filters_.time = opts.time; delete out.filters_.lastTimePeriod; }
		if (opts.proj) out.proj(opts.proj);
		if (opts.geo) out.geo(opts.geo);
		if (opts.ny) out.NUTSyear(opts.ny);
		if (opts.lg) out.lg(opts.lg);
		if (opts.sl) out.showLegend(opts.sl);
		if (opts.clnb) out.clnb(+opts.clnb);
		return out;
	};


	/**
	 * @function exportMapToSVG
	 * @description Exports the current map with styling to SVG and downloads it
	 * 
	 */
	out.exportMapToSVG = function () {
		let svgBlob = serialize(out.svg_.node());
		var svgUrl = URL.createObjectURL(svgBlob);
		var downloadLink = document.createElement("a");
		downloadLink.href = svgUrl;
		downloadLink.download = "eurostatmap.svg";
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
	}

	/**
	 * @function exportMapToPNG
	 * @description Exports the current map with styling to PNG and downloads it
	 * 
	 */
	out.exportMapToPNG = function () {
		let canvasPromise = rasterize(out.svg_.node());
		canvasPromise.then((canvasBlob) => {
			var canvasUrl = URL.createObjectURL(canvasBlob);
			var downloadLink = document.createElement("a");
			downloadLink.href = canvasUrl;
			downloadLink.download = "eurostatmap.png";
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);
		})
	}
	return out;
}



// adapted from https://observablehq.com/@mbostock/saving-svg
// turns svg into blob
function serialize(svg) {
	const xmlns = "http://www.w3.org/2000/xmlns/";
	const xlinkns = "http://www.w3.org/1999/xlink";
	const svgns = "http://www.w3.org/2000/svg";
	svg = svg.cloneNode(true);
	const fragment = window.location.href + "#";
	const walker = document.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT, null, false);
	while (walker.nextNode()) {
		for (const attr of walker.currentNode.attributes) {
			if (attr.value.includes(fragment)) {
				attr.value = attr.value.replace(fragment, "#");
			}
		}
	}
	svg.setAttributeNS(xmlns, "xmlns", svgns);
	svg.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);
	const serializer = new window.XMLSerializer;
	const string = serializer.serializeToString(svg);
	return new Blob([string], { type: "image/svg+xml" });
};

// adapted from https://observablehq.com/@mbostock/saving-sv
//svg to canvas blob promise
function rasterize(svg) {
	let resolve, reject;
	const promise = new Promise((y, n) => (resolve = y, reject = n));
	const image = new Image;
	image.onerror = reject;
	image.onload = () => {
		const rect = svg.getBoundingClientRect();
		const canvas = document.createElement('canvas');
		canvas.width = rect.width;
		canvas.height = rect.height;
		const context = canvas.getContext('2d');
		context.drawImage(image, 0, 0, rect.width, rect.height);
		context.canvas.toBlob(resolve);
	};
	image.src = URL.createObjectURL(serialize(svg));
	return promise;
}



/**
 * Get a text tooltip text.
 * 
 * @param {*} rg The region to show information on.
 * @param {*} map The map element
 */
const tooltipTextDefaultFunction = function (rg, map) {
	const buf = [];
	//region name
	buf.push("<b>" + rg.properties.na + "</b><br>");
	//case when no data available
	const sv = map.getStat(rg.properties.id);
	if (!sv || (sv.value != 0 && !sv.value)) {
		buf.push(map.noDataText_);
		return buf.join("");
	}
	//display value
	buf.push(sv.value);
	//unit
	if (map.unitText_) buf.push(" " + map.unitText_);
	//flag
	const f = sv.status;
	if (f && map.tooltipShowFlags_) {
		if (map.tooltipShowFlags_ === "short")
			buf.push(" " + f);
		else {
			const f_ = flags[f];
			buf.push(f_ ? " (" + f_ + ")" : " " + f);
		}
	}
	return buf.join("");
};




/**
 * Retrieve some URL parameters, which could be then reused as map definition parameters.
 * This allow a quick map customisation by simply adding and changing some URL parameters.
 * See map method: setFromURL(...)
 */
export const getURLParameters = function () {
	const ps = {};
	const p = ["w", "h", "x", "y", "z", "s", "lvl", "time", "proj", "geo", "ny", "lg", "sl", "clnb"];
	for (let i = 0; i < p.length; i++)
		ps[p[i]] = getURLParameterByName(p[i]);
	return ps;
};

