import { json, csv } from "d3-fetch";
import { zoom } from "d3-zoom";
import { select, event } from "d3-selection";
import { geoIdentity, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import JSONstat from "jsonstat-toolkit";
import { getEstatDataURL, flags } from './lib/eurostat-base';
import { getBBOXAsGeoJSON, csvToIndex, jsonstatToIndex } from './lib/eurostat-map-util';
import * as tp from './lib/eurostat-tooltip';


/**
 * Build an empty map template.
 * 
 * @param {*} withCenterPoints Set to true (or 1) to add regions center points to the map template, to be used for proportional symbols maps for example.
 */
export const mapTemplate = function (withCenterPoints) {
	//TODO decompose into: map template and stat part?

    const out = {};

	/**
	* Create attributes and set default values
	*/

	out.svgId_ = "map";
	out.svg_ = undefined;

	//map viewport
	out.width_ = 800;
	out.height_ = 0;
	out.geoCenter_ = undefined;
	out.pixSize_ = undefined;

	//map template information
	out.geo_ = "EUR";
	out.scale_ = "20M"; //TODO better choose automatically
	out.scaleExtent_ = [1, 5];
	out.proj_ = "3035";
	out.nutsLvl_ = 3;
	out.NUTSyear_ = 2016;
	out.lg_ = "en";

	//stat data
	//TODO extract that into a "statData" component.
	out.datasetCode_ = "demo_r_d3dens";
	out.filters_ = { lastTimePeriod: 1 };
	out.precision_ = 2;
	out.csvDataSource_ = null;
	out.statData_ = null;   //TODO: may use https://github.com/badosa/JSON-stat/blob/master/utils/fromtable.md ?

	//template default style
	//nuts
	out.nutsrgFillStyle_ = "#eee";
	out.nutsrgSelectionFillStyle_ = "purple";
	out.nutsbnStroke_ = { 0: "#777", 1: "#777", 2: "#777", 3: "#777", oth: "#444", co: "#1f78b4" };
	out.nutsbnStrokeWidth_ = { 0: 1, 1: 0.2, 2: 0.2, 3: 0.2, oth: 1, co: 1 };
	//countries
	out.cntrgFillStyle_ = "lightgray";
	out.cntrgSelectionFillStyle_ = "darkgray";
	out.cntbnStroke_ = { def: "#777", co: "#1f78b4" };
	out.cntbnStrokeWidth_ = { def: 1, co: 1 };
	//sea
	out.seaFillStyle_ = "#b3cde3";
	out.drawCoastalMargin_ = true;
	out.coastalMarginColor_ = "white";
	out.coastalMarginWidth_ = 12;
	out.coastalMarginStdDev_ = 12;
	//graticule
	out.drawGraticule_ = true;
	out.graticuleStroke_ = "gray";
	out.graticuleStrokeWidth_ = 1;

	//map title
	out.title_ = "";
	out.titleFontSize_ = 16;
	out.titleFill_ = "black";
	out.titleFontFamily_ = "Helvetica, Arial, sans-serif";

	//default copyright and disclaimer text
	out.bottomText_ = "Administrative boundaries: \u00A9EuroGeographics \u00A9UN-FAO \u00A9INSTAT \u00A9Turkstat"; //"(C)EuroGeographics (C)UN-FAO (C)Turkstat";
	out.bottomTextFontSize_ = 12;
	out.bottomTextFill_ = "black";
	out.bottomTextFontFamily_ = "Helvetica, Arial, sans-serif";
	out.bottomTextPadding_ = 10;
	out.bottomTextTooltipMessage_ = "The designations employed and the presentation of material on this map do not imply the expression of any opinion whatsoever on the part of the European Union concerning the legal status of any country, territory, city or area or of its authorities, or concerning the delimitation of its frontiers or boundaries. Kosovo*: This designation is without prejudice to positions on status, and is in line with UNSCR 1244/1999 and the ICJ Opinion on the Kosovo declaration of independence. Palestine*: This designation shall not be construed as recognition of a State of Palestine and is without prejudice to the individual positions of the Member States on this issue.";

	//tooltip
	//the function returning the tooltip text
	out.tooltipText_ = tooltipTextDefaultFunction;
	out.tooltipShowFlags_ = "short"; //"short" "long"
	out.unitText_ = "";

	//legend
	out.showLegend_ = false;
	out.legend_ = undefined;

	//transition duration
	out.transitionDuration_ = 800;

	//for maps using special fill patterns, this is the function to define them in the SVG image
	//	See as-well: getFillPatternLegend and getFillPatternDefinitionFun
	out.filtersDefinitionFun_ = function () {};


	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	for (const att in out)
		out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };



    /**
	 * Private attributes
	 */

	//statistical values, as an array
	//TODO extract that into a "statData" component.
	out._values;

	//geo data, as the raw topojson object returned by nuts2json API
	out._geoData;

	//the nuts regions, as a GeoJSON feature collection
	out._nutsRG;

	//the d3 path, to draw SVG paths with screen coordinates
	out._path;

	//the map tooltip element
	out._tooltip = (out.tooltipText_ || out.bottomTextTooltipMessage_) ? tp.tooltip() : null;



    	/**
	 * Build a map object.
	 * This method should be called once, preferably after the map attributes have been set to some initial values.
	 */
	out.build = function () {

		const svg = select("#" + out.svgId());
		out.svg(svg);

		//set SVG dimensions
		//if no height was specified, use 85% of the width.
		if(!out.height()) out.height( 0.85 * out.width() );
		svg.attr("width", out.width()).attr("height", out.height());

		if (out.drawCoastalMargin_)
			//define filter for coastal margin
			svg.append("filter").attr("id", "coastal_blur").attr("x", "-200%").attr("y", "-200%").attr("width", "400%")
				.attr("height", "400%").append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", out.coastalMarginStdDev_);

		//add additional filters for fill patterns for example
		out.filtersDefinitionFun_(svg, out.clnb_);

		//create drawing group, as first child
		const zg = svg.insert("g",":first-child").attr("id", "zoomgroup");

		//make drawing group zoomable
		if (out.scaleExtent()) {
			svg.call(zoom()
			.scaleExtent(out.scaleExtent())
			.on('zoom', function(a,b,c) {
				const k = event.transform.k;
				const cs = ["gra", "bn_0", /*"bn_1", "bn_2", "bn_3",*/ "bn_co", "cntbn", "symbol"];
				for (let i = 0; i < cs.length; i++)
					svg.selectAll("." + cs[i]).style("stroke-width", function(d) {
						return (1/k) + "px";
					});
				zg.attr("transform", event.transform);
			}));
		}

		//title
		//TODO

		//legend element
		if(out.showLegend()) {
			//create legend element
			const lg = out.legend();
			const lgg = svg.append("g").attr("id", lg.gId());
			lg.build();

			//set position
			const dx = out.width() - lg.width();
			const dy = lg.boxPadding() + lg.titleFontSize();
			lgg.attr("transform", "translate("+dx+","+dy+")");
		}

		//bottom text
		if (out.bottomText_)
			out.svg().append("text").attr("id", "bottomtext").attr("x", out.bottomTextPadding_).attr("y", out.height_ - out.bottomTextPadding_)
				.text(out.bottomText_)
				.style("font-family", out.bottomTextFontFamily_)
				.style("font-size", out.bottomTextFontSize_)
				.style("fill", out.bottomTextFill_)
				.on("mouseover", function () {
					out._tooltip.mw___ = out._tooltip.style("max-width");
					out._tooltip.f___ = out._tooltip.style("font");
					out._tooltip.style("max-width", "800px");
					out._tooltip.style("font", "6px");
					if (out.bottomTextTooltipMessage_) out._tooltip.mouseover(out.bottomTextTooltipMessage_);
				}).on("mousemove", function () {
					if (out.bottomTextTooltipMessage_) out._tooltip.mousemove();
				}).on("mouseout", function () {
					if (out.bottomTextTooltipMessage_) out._tooltip.mouseout();
					out._tooltip.style("max-width", out._tooltip.mw___);
					out._tooltip.style("font", out._tooltip.f___);
				});

		//retrieve geo data
		out.updateGeoData();

		//retrieve stat data
		//TODO extract that into a "statData" component.
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
		//TODO: expose URL
		json("https://raw.githubusercontent.com/eurostat/Nuts2json/master/pub/v1/" + out.NUTSyear_ + (out.geo_==="EUR"?"":"/"+this.geo_) + "/" + out.proj_ + "/" + out.scale_ + "/" + out.nutsLvl_ + ".json")
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
	 * Buid an empty map template, based on the geometries only.
	*/
	out.buildMapTemplate = function () {

		//geo center and extent: if not specified, use the default one, or the compute one from the topojson bbox
		const dp = _defaultPosition[out.geo()+"_"+out.proj()];
		if(!out.geoCenter())
			if(dp) out.geoCenter( dp.geoCenter );
			else out.geoCenter( [ 0.5*(out._geoData.bbox[0] + out._geoData.bbox[2]), 0.5*(out._geoData.bbox[1] + out._geoData.bbox[3])] );
		//pixel size (zoom level): if not specified, compute value from SVG dimensions and topojson geographical extent
		if(!out.pixSize())
			if(dp) out.pixSize( dp.widthGeo/out.width() );
			else out.pixSize( Math.min((out._geoData.bbox[2] - out._geoData.bbox[0]) / out.width_, (out._geoData.bbox[3] - out._geoData.bbox[1]) / out.height_) );

		//SVG drawing function
		//compute geo bbox from geocenter, pixsize and SVG dimensions
		const bbox = [out.geoCenter_[0]-0.5*out.pixSize_*out.width_, out.geoCenter_[1]-0.5*out.pixSize_*out.height_, out.geoCenter_[0]+0.5*out.pixSize_*out.width_, out.geoCenter_[1]+0.5*out.pixSize_*out.height_];
		out._path = geoPath().projection(geoIdentity().reflectY(true).fitSize([out.width_, out.height_], getBBOXAsGeoJSON(bbox)));


		//decode topojson to geojson
		const gra = feature(out._geoData, out._geoData.objects.gra).features;
		out._nutsRG = feature(out._geoData, out._geoData.objects.nutsrg).features; //TODO no longer needed
		const nutsbn = feature(out._geoData, out._geoData.objects.nutsbn).features;
		const cntrg = feature(out._geoData, out._geoData.objects.cntrg).features;
		const cntbn = feature(out._geoData, out._geoData.objects.cntbn).features;

		//prepare drawing group
		const zg = select("#zoomgroup");
		zg.selectAll("*").remove();

		//draw background rectangle
		zg.append("rect").attr("id", "sea").attr("x", -5*out.width_).attr("y", -5*out.height_)
			.attr("width", 11*out.width_).attr("height", 11*out.height_)
			.style("fill", out.seaFillStyle_);

		if (out.drawCoastalMargin_) {
			//draw coastal margin
			const cg = zg.append("g").attr("id", "g_coast_margin")
				.style("fill", "none")
				.style("stroke-width", out.coastalMarginWidth_)
				.style("stroke", out.coastalMarginColor_)
				.style("filter", "url(#coastal_blur)")
				.style("stroke-linejoin", "round")
				.style("stroke-linecap", "round");
			//countries bn
			if(cntbn)
			cg.append("g").attr("id", "g_coast_margin_cnt")
				.selectAll("path").data(cntbn).enter().filter(function (bn) { return bn.properties.co === "T"; })
				.append("path").attr("d", out._path);
			//nuts bn
			if(nutsbn)
			cg.append("g").attr("id", "g_coast_margin_nuts")
				.selectAll("path").data(nutsbn).enter().filter(function (bn) { return bn.properties.co === "T"; })
				.append("path").attr("d", out._path);
		}

		if (gra && out.drawGraticule_) {
			//draw graticule
			zg.append("g").attr("id", "g_gra")
				.style("fill", "none")
				.style("stroke", out.graticuleStroke())
				.style("stroke-width", out.graticuleStrokeWidth())
				.selectAll("path").data(gra)
				.enter().append("path").attr("d", out._path).attr("class", "gra")
		}

		//draw country regions
		if(cntrg)
		zg.append("g").attr("id", "g_cntrg").selectAll("path").data(cntrg)
			.enter().append("path").attr("d", out._path)
			.attr("class", "cntrg")
			.style("fill", out.cntrgFillStyle_)
			.on("mouseover", function (rg) {
				select(this).style("fill", out.cntrgSelectionFillStyle_);
				if (out.tooltipText_) out._tooltip.mouseover("<b>" + rg.properties.na + "</b>");
			}).on("mousemove", function () {
				if (out.tooltipText_) out._tooltip.mousemove();
			}).on("mouseout", function () {
				select(this).style("fill", out.cntrgFillStyle_);
				if (out.tooltipText_) out._tooltip.mouseout();
			});

		//draw NUTS regions
		if(out._nutsRG)
		zg.append("g").attr("id", "g_nutsrg").selectAll("path").data(out._nutsRG)
			.enter().append("path").attr("d", out._path)
			.attr("class", "nutsrg")
			.attr("fill", out.nutsrgFillStyle_)
			.on("mouseover", function (rg) {
				const sel = select(this);
				sel.attr("fill___", sel.attr("fill"));
				sel.attr("fill", out.nutsrgSelectionFillStyle_);
				if (out.tooltipText_) { out._tooltip.mouseover(out.tooltipText_(rg, out)); }
			}).on("mousemove", function () {
				if (out.tooltipText_) out._tooltip.mousemove();
			}).on("mouseout", function () {
				const sel = select(this);
				sel.attr("fill", sel.attr("fill___"));
				if (out.tooltipText_) out._tooltip.mouseout();
			});

		//draw country boundaries
		if(cntbn)
		zg.append("g").attr("id", "g_cntbn")
			.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
			.selectAll("path").data(cntbn)
			.enter().append("path").attr("d", out._path)
			.attr("class", function (bn) { if (bn.properties.co === "T") return "bn_co"; return "cntbn"; })
			.style("stroke", function (bn) { if (bn.properties.co === "T") return out.cntbnStroke_.co; return out.cntbnStroke_.def; })
			.style("stroke-width", function (bn) { if (bn.properties.co === "T") return out.cntbnStrokeWidth_.co; return out.cntbnStrokeWidth_.def; });

		//draw NUTS boundaries
		if(nutsbn) {
		nutsbn.sort(function (bn1, bn2) { return bn2.properties.lvl - bn1.properties.lvl; });
		zg.append("g").attr("id", "g_nutsbn")
			.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
			.selectAll("path").data(nutsbn).enter()
			.append("path").attr("d", out._path)
			.attr("class", function (bn) {
				bn = bn.properties;
				if (bn.co === "T") return "bn_co";
				const cl = ["bn_" + bn.lvl];
				//if (bn.oth === "T") cl.push("bn_oth");
				return cl.join(" ");
			})
			.style("stroke", function (bn) {
				bn = bn.properties;
				if (bn.co === "T") return out.nutsbnStroke_.co || "#1f78b4";
				//if (bn.oth === "T") return out.nutsbnStroke_.oth || "#444";
				return out.nutsbnStroke_[bn.lvl] || "#777";
			})
			.style("stroke-width", function (bn) {
				bn = bn.properties;
				if (bn.co === "T") return out.nutsbnStrokeWidth_.co || 1;
				if(bn.lvl>0) return out.nutsbnStrokeWidth_[bn.lvl] || 0.2;
				//if (bn.oth === "T") return out.nutsbnStrokeWidth_.oth || 1;
				return out.nutsbnStrokeWidth_[bn.lvl] || 0.2;
			});
		}

		//prepare group for proportional symbols, with nuts region centroids
		if(withCenterPoints) {
			const gcp = zg.append("g").attr("id", "g_ps");

			gcp.selectAll("circle")
			.data(out._nutsRG/*.sort(function (a, b) { return b.properties.val - a.properties.val; })*/)
			.enter() //.filter(function (d) { return d.properties.val; })
			.append("circle")
			.attr("transform", function (d) { return "translate(" + out._path.centroid(d) + ")"; })
			.attr("r", 1)
			.attr("class", "symbol")
			.style("fill", "gray")
			.on("mouseover", function (rg) {
				select(this).style("fill", out.nutsrgSelectionFillStyle_);
				if (out.tooltipText_) { out._tooltip.mouseover(out.tooltipText_(rg, out)); }
			}).on("mousemove", function () {
				if (out.tooltipText_) out._tooltip.mousemove();
			}).on("mouseout", function () {
				select(this).style("fill", out.psFill_);
				if (out.tooltipText_) out._tooltip.mouseout();
			});
		}

		return out;
	};





	//TODO extract that into a "statData" component.
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




	//TODO extract that into a "statData" component.
	/**
	 * Update the map with new stat data.
	 * This method should be called after stat data attached to the map have changed, to refresh the map.
	 * If the stat data sources have changed, call *updateStatData* instead.
	 */
	out.updateStatValues = function () {

		//build the list of statistical values
		//join values and status to NUTS regions
		out._values = [];
		if(out._nutsRG)
		for (let i = 0; i < out._nutsRG.length; i++) {
			const rg = out._nutsRG[i];
			const value = out.statData_[rg.properties.id];
			if (!value) continue;
			if (!value.value == 0 && !value.value) continue;
			let v = value.value;
			if (!isNaN(+v)) v = +v;
			rg.properties.val = v;
			if (value.status) rg.properties.st = value.status;
			out._values.push(v);
		}

		//update classification and styles
		out.updateClassification();
		out.updateStyle();

		//update legend, if any
		if(out.legend_) out.legend().update();

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

	return out;
}




/**
 * Default positions and width (in projection unit) for territories and projections.
 */
const _defaultPosition = {
	//"EUR_3035":{ geoCenter:[4970000,3350000], widthGeo:5200000 },
	//TODO add others
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
	if (rg.properties.val != 0 && !rg.properties.val) {
		buf.push(map.noDataText_);
		return buf.join("");
	}
	//display value
	buf.push(rg.properties.val);
	//unit
	if (map.unitText_) buf.push(" " + map.unitText_);
	//flag
	if (rg.properties.st && map.tooltipShowFlags_) {
		if (map.tooltipShowFlags_ === "short")
			buf.push(" " + rg.properties.st);
		else {
			const f = flags[rg.properties.st];
			buf.push(f ? " (" + f + ")" : " " + rg.properties.st);
		}
	}
	return buf.join("");
};




/**
 * Retrieve some URL parameters, which could be then reused as map definition parameters.
 * This allow a quick map customisation by simply adding and changing some URL parameters.
 */
export const getURLParameters = function () {
	const ps = {};
	const p = ["w", "h","x", "y", "z", "s", "lvl", "time", "proj", "geo", "ny", "lg", "sl", "clnb"];
	for (let i = 0; i < p.length; i++)
		ps[p[i]] = getURLParameterByName(p[i]);
	return ps;
};



// fill pattern style


/**
 * Build a fill pattern legend object { nd:"white", 0:"url(#pattern_0)", 1:"url(#pattern_1)", ... }
 */
export const getFillPatternLegend = function () {
	return function (ecl) { return "url(#pattern_" + ecl + ")"; }
}


/**
 * Return a function which builds fill patterns style.
 * The returned function has for arguments the SVG element where to use the fill pattern, and the number of classes.
 * 
 * @param {*} opts Various parameters on the fill pattern.
 */
export const getFillPatternDefinitionFun = function (opts) {
	opts = opts || {};
	opts.shape = opts.shape || "circle";
	const ps = opts.patternSize || 5;
	const smin = opts.minSize || 1;
	const smax = opts.maxSize || 5.5;
	opts.bckColor = opts.bckColor || "white";
	opts.symbColor = opts.symbColor || "black";
	return function (svg, clnb) {
		for (let i = 0; i < clnb; i++) {
			const si = smin + (smax - smin) * i / (clnb - 1);
			const patt = svg.append("pattern").attr("id", "pattern_" + i).attr("x", "0").attr("y", "0").attr("width", ps).attr("height", ps).attr("patternUnits", "userSpaceOnUse");
			patt.append("rect").attr("x", 0).attr("y", 0).attr("width", ps).attr("height", ps).style("stroke", "none").style("fill", opts.bckColor)
			if (opts.shape == "square")
				patt.append("rect").attr("x", 0).attr("y", 0).attr("width", si).attr("height", si).style("stroke", "none").style("fill", opts.symbColor)
			else
				patt.append("circle").attr("cx", ps * 0.5).attr("cy", ps * 0.5).attr("r", si * 0.5).style("stroke", "none").style("fill", opts.symbColor)
		}
	};
};

