import { min, max } from "d3-array";
import { json, csv } from "d3-fetch";
import { zoom } from "d3-zoom";
import { select, event } from "d3-selection";
import { geoIdentity, geoPath } from "d3-geo";
import { scaleQuantile, scaleQuantize, scaleThreshold, scaleSqrt, scaleOrdinal } from "d3-scale";
import { interpolateYlOrBr } from "d3-scale-chromatic";
import { feature } from "topojson-client";
import JSONstat from "jsonstat-toolkit";
import { getEstatDataURL } from './lib/eurostat-base';
import * as tp from './lib/eurostat-tooltip';
import * as lgch from './legend/legend-choropleth';
import * as lgct from './legend/legend-categorical';
import * as lgps from './legend/legend-proportionnal-symbols';


/**
 * Function returning a eurostat-map object.
 */
export const map = function () {
	//TODO: upgrade to d3 v6?

	//the map object to return
	var out = {};

	/**
	* Create attributes and set default values
	*/

	out.svgId_ = "map";
	out.svg_ = undefined;
	out.type_ = "ch"; //or "ps" or "ct"

	out.width_ = 800;
	out.height_ = 0;
	out.geoCenter_ = undefined;
	out.pixSize_ = undefined;

	out.datasetCode_ = "demo_r_d3dens";
	out.filters_ = { lastTimePeriod: 1 };
	out.precision_ = 2;
	out.csvDataSource_ = null;
	out.statData_ = null;   //TODO: may use https://github.com/badosa/JSON-stat/blob/master/utils/fromtable.md ?

	out.geo_ = "EUR";
	out.scale_ = "20M"; //TODO better choose automatically
	out.scaleExtent_ = [1, 5];
	out.proj_ = "3035";
	out.nutsLvl_ = 3;
	out.NUTSyear_ = 2016;
	out.lg_ = "en";

	out.tooltipText_ = tooltipTextDefaultFunction;
	out.tooltipShowFlags_ = "short"; //"short" "long"
	out.unitText_ = "";

	//choropleth map
	out.classifMethod_ = "quantile"; // or: equinter  threshold
	out.threshold_ = [0];
	out.makeClassifNice_ = true;
	out.clnb_ = 7;
	out.colorFun_ = interpolateYlOrBr;
	out.classToFillStyleCH_ = getColorLegend(out.colorFun_);
	out.filtersDefinitionFun_ = function () { };
	out.noDataFillStyle_ = "lightgray";
	out.noDataText_ = "No data available";

	//proportional circles
	out.psMaxSize_ = 30;
	out.psMinSize_ = 0.8;
	out.psMinValue_ = 0;
	out.psFill_ = "#B45F04";
	out.psFillOpacity_ = 0.7;
	out.psStroke_ = "#fff";
	out.psStrokeWidth_ = 0.5;

	//categorical maps
	out.classToFillStyleCT_ = undefined;
	out.classToText_ = undefined;

	//style
	out.nutsrgFillStyle_ = "#eee"; //used for ps map
	out.nutsrgSelectionFillStyle_ = "purple";
	out.nutsbnStroke_ = { 0: "#777", 1: "#777", 2: "#777", 3: "#777", oth: "#444", co: "#1f78b4" };
	out.nutsbnStrokeWidth_ = { 0: 1, 1: 0.2, 2: 0.2, 3: 0.2, oth: 1, co: 1 };
	out.cntrgFillStyle_ = "lightgray";
	out.cntrgSelectionFillStyle_ = "darkgray";
	out.cntbnStroke_ = { def: "#777", co: "#1f78b4" };
	out.cntbnStrokeWidth_ = { def: 1, co: 1 };
	out.seaFillStyle_ = "#b3cde3";
	out.drawCoastalMargin_ = true;
	out.coastalMarginColor_ = "white";
	out.coastalMarginWidth_ = 12;
	out.coastalMarginStdDev_ = 12;
	out.drawGraticule_ = true;
	out.graticuleStroke_ = "gray";
	out.graticuleStrokeWidth_ = 1;

	//legend
	out.showLegend_ = false;
	out.legend_ = undefined;

	//copyright text
	out.bottomText_ = "Administrative boundaries: \u00A9EuroGeographics \u00A9UN-FAO \u00A9INSTAT \u00A9Turkstat"; //"(C)EuroGeographics (C)UN-FAO (C)Turkstat";
	out.bottomTextFontSize_ = 12;
	out.bottomTextFill_ = "black";
	out.bottomTextFontFamily_ = "Helvetica, Arial, sans-serif";
	out.bottomTextPadding_ = 10;
	out.bottomTextTooltipMessage_ = "The designations employed and the presentation of material on this map do not imply the expression of any opinion whatsoever on the part of the European Union concerning the legal status of any country, territory, city or area or of its authorities, or concerning the delimitation of its frontiers or boundaries. Kosovo*: This designation is without prejudice to positions on status, and is in line with UNSCR 1244/1999 and the ICJ Opinion on the Kosovo declaration of independence. Palestine*: This designation shall not be construed as recognition of a State of Palestine and is without prejudice to the individual positions of the Member States on this issue.";

	//the classifier: a function which return a class number from a stat value.
	out.classifier_ = undefined;
	//the inverse classifier, used only for categorical maps: a function returning the category value from the category class
	out.classifierInverse_ = undefined;


	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	for (let att in out)
		(function () {
			var att_ = att;
			out[att_.substring(0, att_.length - 1)] = function (v) { if (!arguments.length) return out[att_]; out[att_] = v; return out; };
		})();

	//override of some special getters/setters

	out.colorFun = function (v) { if (!arguments.length) return out.colorFun_; out.colorFun_ = v; out.classToFillStyleCH_ = getColorLegend(out.colorFun_); return out; };
	out.threshold = function (v) { if (!arguments.length) return out.threshold_; out.threshold_ = v; out.clnb(v.length + 1); return out; };

	out.legend = function (v) {
		if (!arguments.length) {
			//create legend if needed
			if(!out.legend_) {
				const type = out.type();
				if (type == "ch") out.legend_ = lgch.legendChoropleth(out);
				else if (type == "ct") out.legend_ = lgct.legendCategorical(out);
				else if (type == "ps") out.legend_ = lgps.legendProportionnalSymbols(out);
				else console.log("Unknown map type: " + type)
			}
			return out.legend_;
		}
		//setter: link map and legend
		out.legend_ = v; v.map(out);
		return out;
	};


	/**
	 * Set some map attributes based on URL parameters.
	 * To be used with *loadURLParameters()* function.
	 * 
	 * @param {*} opts The URL parameters as an object, as returned by the *loadURLParameters()* function.
	 */
	out.set = function (opts) {
		if (opts.w) out.width(opts.w);
		if (opts.s) out.scale(opts.s);
		if (opts.lvl) out.nutsLvl(opts.lvl);
		if (opts.time) { out.filters_.time = opts.time; delete out.filters_.lastTimePeriod; }
		if (opts.proj) out.proj(opts.proj);
		if (opts.y) out.NUTSyear(opts.y);
		if (opts.clnb) out.clnb(+opts.clnb);
		if (opts.lg) out.lg(opts.lg);
		if (opts.type) out.type(opts.type);
		return out;
	};



	/**
	 * Private attributes
	 */

	//statistical values, as an array
	let values;

	//geo data, as the raw topojson object returned by nuts2json API
	let geoData;

	//the nuts regions, as a GeoJSON feature collection
	let nutsRG;

	//the d3 path, to draw SVG paths with screen coordinates
	let path;

	//the map tooltip element
	let tooltip = (out.tooltipText_ || out.bottomTextTooltipMessage_) ? tp.tooltip() : null;



	/**
	 * Build a map in the svg element.
	 * This method should be called once, preferably after the map attributes have been set to some initial values.
	 */
	out.build = function () {

		const svg = select("#" + out.svgId());
		out.svg(svg);

		//empty svg element
		//TODO necessary?
		//svg.selectAll("*").remove();

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

		//prepare drawing group
		var zg = svg.append("g").attr("id", "zoomgroup");
		//make zoomable
		if (out.scaleExtent()) {
			svg.call(zoom()
			.scaleExtent(out.scaleExtent())
			.on('zoom', function(a,b,c) {
				var k = event.transform.k;
				var cs = ["gra", "bn_0", /*"bn_1", "bn_2", "bn_3",*/ "bn_co", "cntbn", "symbol"];
				for (var i = 0; i < cs.length; i++)
					svg.selectAll("." + cs[i]).style("stroke-width", function(d) {
						return (1/k) + "px";
					});
				zg.attr("transform", event.transform);
			}));
		}

		//build legend element
		if(out.showLegend()) {
			//create legend element
			const lg = out.legend();
			const lgg = svg.append("g").attr("id", lg.gId());
			lg.build();
			//position
			const dx = out.width() - lg.width() - lg.boxMargin();
			const dy = lg.boxMargin();
			lgg.attr("transform", "translate("+dx+","+dy+")");
		}

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
		geoData = null;

		//get geo data from Nuts2json API
		json("https://raw.githubusercontent.com/eurostat/Nuts2json/master/pub/v1/" + out.NUTSyear_ + (out.geo_==="EUR"?"":"/"+this.geo_) + "/" + out.proj_ + "/" + out.scale_ + "/" + out.nutsLvl_ + ".json")
			.then(function (geo___) {
				geoData = geo___;

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
					if (!geoData) return;
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
					if (!geoData) return;
					out.updateStatValues();
				});
		}
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
			else out.geoCenter( [ 0.5*(geoData.bbox[0] + geoData.bbox[2]), 0.5*(geoData.bbox[1] + geoData.bbox[3])] );
		//pixel size (zoom level): if not specified, compute value from SVG dimensions and topojson geographical extent
		if(!out.pixSize())
			if(dp) out.pixSize( dp.widthGeo/out.width() );
			else out.pixSize( Math.min((geoData.bbox[2] - geoData.bbox[0]) / out.width_, (geoData.bbox[3] - geoData.bbox[1]) / out.height_) );

		//SVG drawing function
		//compute geo bbox from geocenter, pixsize and SVG dimensions
		const bbox = [out.geoCenter_[0]-0.5*out.pixSize_*out.width_, out.geoCenter_[1]-0.5*out.pixSize_*out.height_, out.geoCenter_[0]+0.5*out.pixSize_*out.width_, out.geoCenter_[1]+0.5*out.pixSize_*out.height_];
		path = geoPath().projection(geoIdentity().reflectY(true).fitSize([out.width_, out.height_], getBBOXAsGeoJSON(bbox)));


		//decode topojson to geojson
		const gra = feature(geoData, geoData.objects.gra).features;
		nutsRG = feature(geoData, geoData.objects.nutsrg).features;
		const nutsbn = feature(geoData, geoData.objects.nutsbn).features;
		const cntrg = feature(geoData, geoData.objects.cntrg).features;
		const cntbn = feature(geoData, geoData.objects.cntbn).features;

		//prepare drawing group
		var zg = select("#zoomgroup");
		zg.selectAll("*").remove();

		//draw background rectangle
		zg.append("rect").attr("id", "sea").attr("x", -5*out.width_).attr("y", -5*out.height_)
			.attr("width", 11*out.width_).attr("height", 11*out.height_)
			.style("fill", out.seaFillStyle_);

		if (out.drawCoastalMargin_) {
			//draw coastal margin
			var cg = zg.append("g").attr("id", "g_coast_margin")
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
				.append("path").attr("d", path);
			//nuts bn
			if(nutsbn)
			cg.append("g").attr("id", "g_coast_margin_nuts")
				.selectAll("path").data(nutsbn).enter().filter(function (bn) { return bn.properties.co === "T"; })
				.append("path").attr("d", path);
		}

		if (gra && out.drawGraticule_) {
			//draw graticule
			zg.append("g").attr("id", "g_gra")
				.style("fill", "none")
				.style("stroke", out.graticuleStroke())
				.style("stroke-width", out.graticuleStrokeWidth())
				.selectAll("path").data(gra)
				.enter().append("path").attr("d", path).attr("class", "gra")
		}

		//draw country regions
		if(cntrg)
		zg.append("g").attr("id", "g_cntrg").selectAll("path").data(cntrg)
			.enter().append("path").attr("d", path)
			.attr("class", "cntrg")
			.style("fill", out.cntrgFillStyle_)
			.on("mouseover", function (rg) {
				select(this).style("fill", out.cntrgSelectionFillStyle_);
				if (out.tooltipText_) tooltip.mouseover("<b>" + rg.properties.na + "</b>");
			}).on("mousemove", function () {
				if (out.tooltipText_) tooltip.mousemove();
			}).on("mouseout", function () {
				select(this).style("fill", out.cntrgFillStyle_);
				if (out.tooltipText_) tooltip.mouseout();
			});

		//draw NUTS regions
		if(nutsRG)
		zg.append("g").attr("id", "g_nutsrg").selectAll("path").data(nutsRG)
			.enter().append("path").attr("d", path)
			.attr("class", "nutsrg")
			.attr("fill", out.nutsrgFillStyle_)
			.on("mouseover", function (rg) {
				var sel = select(this);
				sel.attr("fill___", sel.attr("fill"));
				sel.attr("fill", out.nutsrgSelectionFillStyle_);
				if (out.tooltipText_) { tooltip.mouseover(out.tooltipText_(rg, out)); }
			}).on("mousemove", function () {
				if (out.tooltipText_) tooltip.mousemove();
			}).on("mouseout", function () {
				var sel = select(this);
				sel.attr("fill", sel.attr("fill___"));
				if (out.tooltipText_) tooltip.mouseout();
			});

		//draw country boundaries
		if(cntbn)
		zg.append("g").attr("id", "g_cntbn")
			.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
			.selectAll("path").data(cntbn)
			.enter().append("path").attr("d", path)
			.attr("class", function (bn) { if (bn.properties.co === "T") return "bn_co"; return "cntbn"; })
			.style("stroke", function (bn) { if (bn.properties.co === "T") return out.cntbnStroke_.co; return out.cntbnStroke_.def; })
			.style("stroke-width", function (bn) { if (bn.properties.co === "T") return out.cntbnStrokeWidth_.co; return out.cntbnStrokeWidth_.def; });

		//draw NUTS boundaries
		if(nutsbn) {
		nutsbn.sort(function (bn1, bn2) { return bn2.properties.lvl - bn1.properties.lvl; });
		zg.append("g").attr("id", "g_nutsbn")
			.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
			.selectAll("path").data(nutsbn).enter()
			.append("path").attr("d", path)
			.attr("class", function (bn) {
				bn = bn.properties;
				if (bn.co === "T") return "bn_co";
				var cl = ["bn_" + bn.lvl];
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

		//prepare group for proportional symbols
		//TODO build them here, with same size. only when style require it.
		zg.append("g").attr("id", "g_ps");


		//add bottom text
		if (out.bottomText_)
			out.svg().append("text").attr("id", "bottomtext").attr("x", out.bottomTextPadding_).attr("y", out.height_ - out.bottomTextPadding_)
				.text(out.bottomText_)
				.style("font-family", out.bottomTextFontFamily_)
				.style("font-size", out.bottomTextFontSize_)
				.style("fill", out.bottomTextFill_)
				.on("mouseover", function () {
					tooltip.mw___ = tooltip.style("max-width");
					tooltip.f___ = tooltip.style("font");
					tooltip.style("max-width", "800px");
					tooltip.style("font", "6px");
					if (out.bottomTextTooltipMessage_) tooltip.mouseover(out.bottomTextTooltipMessage_);
				}).on("mousemove", function () {
					if (out.bottomTextTooltipMessage_) tooltip.mousemove();
				}).on("mouseout", function () {
					if (out.bottomTextTooltipMessage_) tooltip.mouseout();
					tooltip.style("max-width", tooltip.mw___);
					tooltip.style("font", tooltip.f___);
				});

		return out;
	};




	/**
	 * Update the map with new stat data.
	 * This method should be called after stat data attached to the map have changed, to refresh the map.
	 * If the stat data sources have changed, call *updateStatData* instead.
	 */
	out.updateStatValues = function () {

		//build the list of statistical values
		//join values and status to NUTS regions
		values = [];
		if(nutsRG)
		for (var i = 0; i < nutsRG.length; i++) {
			var rg = nutsRG[i];
			var value = out.statData_[rg.properties.id];
			if (!value) continue;
			if (!value.value == 0 && !value.value) continue;
			var v = value.value;
			if (!isNaN(+v)) v = +v;
			rg.properties.val = v;
			if (value.status) rg.properties.st = value.status;
			values.push(v);
		}

		//update classification and styles
		out.updateClassificationAndStyle();

		return out;
	}


	/**
	 * Update the map after classification attributes have been changed.
	 * For example, if the number of classes, or the classification method has changed, call this method to update the map.
	*/
	out.updateClassificationAndStyle = function () {

		//simply return the array [0,1,2,3,...,nb-1]
		//TODO: use 'range' ?
		var getA = function (nb) { var a = []; for (var i = 0; i < nb; i++) a.push(i); return a; }

		if (out.type_ == "ch") {
			//case of choropleth map
			//TODO: make it possible to use continuous color ramps?

			//use suitable classification type
			if (out.classifMethod_ === "quantile") {
				//https://github.com/d3/d3-scale#quantile-scales
				out.classifier( scaleQuantile().domain(values).range(getA(out.clnb_)) );
			} else if (out.classifMethod_ === "equinter") {
				//https://github.com/d3/d3-scale#quantize-scales
				out.classifier( scaleQuantize().domain([min(values), max(values)]).range(getA(out.clnb_)) );
				if (out.makeClassifNice_) classif.nice();
			} else if (out.classifMethod_ === "threshold") {
				//https://github.com/d3/d3-scale#threshold-scales
				out.clnb(out.threshold_.length + 1);
				out.classifier( scaleThreshold().domain(out.threshold_).range(getA(out.clnb_)) );
			}

			//assign class to nuts regions, based on their value
			out.svg().selectAll("path.nutsrg")
				.attr("ecl", function (rg) {
					var v = rg.properties.val;
					if (v != 0 && !v) return "nd";
					return +out.classifier_(+v);
				})
		} else if (out.type_ == "ps") {
			//case of proportionnal circle maps

			out.classifier( scaleSqrt().domain([out.psMinValue_, Math.max.apply(Math, values)]).range([out.psMinSize_ * 0.5, out.psMaxSize_ * 0.5]) );
		} else if (out.type_ == "ct") {
			//case of categorical maps

			//get unique values
			var dom = values.filter(function (item, i, ar) { return ar.indexOf(item) === i; });
			out.clnb(dom.length);
			var rg = getA(out.clnb_);
			out.classifier(scaleOrdinal().domain(dom).range(rg));
			out.classifierInverse(scaleOrdinal().domain(rg).range(dom));

			//assign class to nuts regions, based on their value
			out.svg().selectAll("path.nutsrg")
				.attr("ecl", function (rg) {
					var v = rg.properties.val;
					if (v != 0 && !v) return "nd";
					return +out.classifier_(isNaN(v) ? v : +v);
				})
		} else {
			console.log("Unknown map type: " + out.type_)
			return out;
		}

		//update legend, if any
		if(out.legend_) out.legend().update();

		//update style
		out.updateStyle();

		return out;
	};



	/**
	 * Update the map after styling attributes have been changed.
	 * For example, if the style (color?) for one legend element has changed, call this method to update the map.
	*/
	out.updateStyle = function () {

		if (out.type_ == "ch" || out.type_ == "ct") {
			//choropleth and categorical map
			//apply style to nuts regions depending on class
			out.svg().selectAll("path.nutsrg")
				.attr("fill", function () {
					var ecl = select(this).attr("ecl");
					if (!ecl || ecl === "nd") return out.noDataFillStyle_ || "gray";
					if (out.type_ == "ch") return out.classToFillStyleCH_(ecl, out.clnb_);
					if (out.type_ == "ct") { return out.classToFillStyleCT_[out.classifierInverse()(ecl)] || out.noDataFillStyle_ || "gray"; }
					return out.noDataFillStyle_ || "gray";
				});

		} else if (out.type_ == "ps") {
			//proportionnal symbol map
			//see https://bl.ocks.org/mbostock/4342045 and https://bost.ocks.org/mike/bubble-map/

			if(nutsRG)
			//TODO add circle creation in mapbuid method - change the radius here, only
			out.svg().select("#g_ps").selectAll("circle")
				.data(nutsRG.sort(function (a, b) { return b.properties.val - a.properties.val; }))
				.enter().filter(function (d) { return d.properties.val; })
				.append("circle")
				.attr("transform", function (d) { return "translate(" + path.centroid(d) + ")"; })
				.attr("r", function (d) { return d.properties.val ? out.classifier()(+d.properties.val) : 0; })
				.attr("class", "symbol")
				.on("mouseover", function (rg) {
					select(this).style("fill", out.nutsrgSelectionFillStyle_);
					if (out.tooltipText_) { tooltip.mouseover(out.tooltipText_(rg, out)); }
				}).on("mousemove", function () {
					if (out.tooltipText_) tooltip.mousemove();
				}).on("mouseout", function () {
					select(this).style("fill", out.psFill_);
					if (out.tooltipText_) tooltip.mouseout();
				})
				.style("fill", out.psFill_)
				.style("fill-opacity", out.psFillOpacity_)
				.style("stroke", out.psStroke_)
				.style("stroke-width", out.psStrokeWidth_);

		} else {
			console.log("Unknown map type: " + out.type_);
		}
		return out;
	};


	/**
	 * Retrieve the time stamp of the map, even if not specified in the dimension initially.
	 * This applies only for stat data retrieved from Eurostat API.
	 * This method is useful for example when the data retrieved is the freshest, and one wants to know what this date is, for example to display it in the map title.
	*/
	out.getTime = function () {
		var t = out.filters_.time;
		if (t) return t;
		if (!out.statData_) return;
		t = out.statData_.Dimension("time");
		if (!t || !t.id || t.id.length == 0) return;
		return t.id[0]
	};

	return out;
};





/**
 * Default positions and width (in projection unit) for territories and projections.
 */
const _defaultPosition = {
	"EUR_3035":{ geoCenter:[4970000,3350000], widthGeo:5200000 },
	//TODO add others
}



/**
 * Return a GeoJSON feature representing a bounding box, with multipoint geometry.
 * This bounding box is an array like the one in topojson bbox element.
 * [xmin,ymin,xmax,ymax]
 * This is useful for to call d3.fitSize([w, h], getTopoJSONExtentAsGeoJSON(topo.bbox)))
 * 
 * @param {*} bb The bounding box [xmin,ymin,xmax,ymax]. For topojson data, just give the topojson.bbox element. 
 */
const getBBOXAsGeoJSON = function(bb) {
	return {
		type: "Feature",
		geometry: {
		  type: "MultiPoint",
		  coordinates: [[bb[0], bb[1]], [bb[2], bb[3]]]
		}
	  };
}



/**
 * Get a text tooltip.
 * TODO: use something else, simpler?
 * 
 * @param {*} rg The region to show information on.
 * @param {*} map The map element
 */
const tooltipTextDefaultFunction = function (rg, map) {
	var buf = [];
	//region name
	buf.push("<b>" + rg.properties.na + "</b><br>");
	//case when no data available
	if (rg.properties.val != 0 && !rg.properties.val) {
		buf.push(map.noDataText_);
		return buf.join("");
	}
	//case categorical map
	if (map.type_ === "ct" && map.classToText_) {
		var lbl = map.classToText_[rg.properties.val];
		buf.push(lbl ? lbl : rg.properties.val);
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
			var f = flags[rg.properties.st];
			buf.push(f ? " (" + f + ")" : " " + rg.properties.st);
		}
	}
	return buf.join("");
};


//build a color legend object
export const getColorLegend = function (colorFun) {
	colorFun = colorFun || interpolateYlOrRd;
	return function (ecl, clnb) { return colorFun(ecl / (clnb - 1)); }
}





// indexing


/**
 * Index JSONStat stat values by 'geo' code.
 * Return a structure like: {geo:{value:0,status:""}}
 * 
 * @param {*} jsData The JSONStat data to index
 */
export const jsonstatToIndex = function (jsData) {
	const ind = {};
	const geos = jsData.Dimension("geo").id;
	for (let i = 0; i < geos.length; i++)
		ind[geos[i]] = jsData.Data(i);
	return ind;
};



/**
 * Index CSV stat values by 'geo' code.
 * Return a structure like: {geo:{value:0,status:""}}
 * 
 * @param {*} csvData The CSV data to index
 * @param {*} geoCol The name of the geo column in the CSV data
 * @param {*} valueCol The name of the statistical value column in the CSV file.
 */
export const csvToIndex = function (csvData, geoCol, valueCol) {
	var ind = {};
	for (var i = 0; i < csvData.length; i++) {
		var d = csvData[i];
		var v = d[valueCol];
		ind[d[geoCol]] = { value: isNaN(+v) ? v : +v, status: "" };
	}
	return ind;
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
	var ps = opts.patternSize || 5;
	var smin = opts.minSize || 1;
	var smax = opts.maxSize || 5.5;
	opts.bckColor = opts.bckColor || "white";
	opts.symbColor = opts.symbColor || "black";
	return function (svg, clnb) {
		for (var i = 0; i < clnb; i++) {
			var si = smin + (smax - smin) * i / (clnb - 1);
			var patt = svg.append("pattern").attr("id", "pattern_" + i).attr("x", "0").attr("y", "0").attr("width", ps).attr("height", ps).attr("patternUnits", "userSpaceOnUse");
			patt.append("rect").attr("x", 0).attr("y", 0).attr("width", ps).attr("height", ps).style("stroke", "none").style("fill", opts.bckColor)
			if (opts.shape == "square")
				patt.append("rect").attr("x", 0).attr("y", 0).attr("width", si).attr("height", si).style("stroke", "none").style("fill", opts.symbColor)
			else
				patt.append("circle").attr("cx", ps * 0.5).attr("cy", ps * 0.5).attr("r", si * 0.5).style("stroke", "none").style("fill", opts.symbColor)
		}
	};
};


