import { json } from "d3-fetch";
import { zoom } from "d3-zoom";
import { select, event } from "d3-selection";
import { geoIdentity, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { getBBOXAsGeoJSON } from '../lib/eurostat-map-util';
import * as tp from '../lib/eurostat-tooltip';

/**
 * The map template: only the geometrical part.
 * To be used as a base map for a statistical map.
 * 
 * @param {*} withCenterPoints Set to true (or 1) to add regions center points to the map template, to be used for proportional symbols maps for example.
 */
export const mapTemplate = function (withCenterPoints) {

	//build map template object
	const out = {};

	/**
	* Create attributes and set default values
	*/

	//map
	out.svgId_ = "map";
	out.svg_ = undefined;
	out.width_ = 800;
	out.height_ = 0;

	//geographical focus
	out.nutsLvl_ = 3;
	out.NUTSyear_ = 2016;
	out.geo_ = "EUR";
	out.proj_ = "3035";
	out.scale_ = "20M"; //TODO better choose automatically ?
	out.geoCenter_ = undefined;
	out.pixSize_ = undefined;

	//map title
	out.title_ = "";
	out.titleFontSize_ = 25;
	out.titleFill_ = "black";
	out.titlePosition_ = undefined;
	out.titleFontFamily_ = "Helvetica, Arial, sans-serif";
	out.titleFontWeight_ = "bold";

	//template default style
	//nuts
	out.nutsrgFillStyle_ = "#eee";
	out.nutsrgSelFillSty_ = "purple";
	out.nutsbnStroke_ = { 0: "#777", 1: "#777", 2: "#777", 3: "#777", oth: "#444", co: "#1f78b4" };
	out.nutsbnStrokeWidth_ = { 0: 1, 1: 0.2, 2: 0.2, 3: 0.2, oth: 1, co: 1 };
	//countries
	out.cntrgFillStyle_ = "lightgray";
	out.cntrgSelFillSty_ = "darkgray";
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

    //default copyright and disclaimer text
	out.bottomText_ = "Administrative boundaries: \u00A9EuroGeographics \u00A9UN-FAO \u00A9INSTAT \u00A9Turkstat"; //"(C)EuroGeographics (C)UN-FAO (C)Turkstat";
	out.botTxtFontSize_ = 12;
	out.botTxtFill_ = "black";
	out.botTxtFontFamily_ = "Helvetica, Arial, sans-serif";
	out.botTxtPadding_ = 10;
	out.botTxtTooltipTxt_ = "The designations employed and the presentation of material on this map do not imply the expression of any opinion whatsoever on the part of the European Union concerning the legal status of any country, territory, city or area or of its authorities, or concerning the delimitation of its frontiers or boundaries. Kosovo*: This designation is without prejudice to positions on status, and is in line with UNSCR 1244/1999 and the ICJ Opinion on the Kosovo declaration of independence. Palestine*: This designation shall not be construed as recognition of a State of Palestine and is without prejudice to the individual positions of the Member States on this issue.";

	//tooltip
	//the function returning the tooltip text
	out.tooltipText_ = rg => { return rg.properties.na; };
	out.tooltipShowFlags_ = "short"; //"short" "long"
	out.unitText_ = "";

    out.zoomExtent_ = [1,1];
	out.nuts2jsonBaseURL_ = "https://raw.githubusercontent.com/eurostat/Nuts2json/master/pub/v1/";

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	for (const att in out)
		out[att.substring(0, att.length - 1)] = function(v) { if (!arguments.length) return out[att]; out[att] = v; return out; };


	/**
	 * geo data, as the raw topojson object returned by nuts2json API
	 */
	out._geoData;


	/**
	 * Return promise for Nuts2JSON topojson data.
	 */
	out.getGeoDataPromise = function() {
		const buf = [];
		buf.push(out.nuts2jsonBaseURL_);
		buf.push(out.NUTSyear_);
		if(out.geo_ != "EUR") buf.push("/" + this.geo_ );
		buf.push("/"); buf.push(out.proj_);
		buf.push("/"); buf.push(out.scale_);
		buf.push("/"); buf.push(out.nutsLvl_);
		buf.push(".json");
		return json(buf.join(""));
	}


	/**
	 * 
	 */
	out.updateGeoMT = function (callback) {

		//erase previous data
		out._geoData = null;

		//get geo data from Nuts2json API
		out.getGeoDataPromise().then(function (geo___) {
				out._geoData = geo___;

				//build map template
				out.buildMapTemplate();

				//callback
				callback();
			});
		return out;
	}




    /**
	 * Build a map object.
	 */
	out.buildMapTemplateBase = function () {

		//get svg element. Create it if it does not exists
		let svg = select("#" + out.svgId());
		if (svg.size() == 0)
			svg = select("body").append("svg").attr("id", out.svgId())
		out.svg(svg);

		//set SVG dimensions
		//if no height was specified, use 85% of the width.
		if (!out.height()) out.height(0.85 * out.width());
		svg.attr("width", out.width()).attr("height", out.height());

		if (out.drawCoastalMargin_)
			//define filter for coastal margin
			svg.append("filter").attr("id", "coastal_blur").attr("x", "-200%").attr("y", "-200%").attr("width", "400%")
				.attr("height", "400%").append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", out.coastalMarginStdDev_);

		//create drawing group, as first child
		const zg = svg.insert("g", ":first-child").attr("id", "zoomgroup");

		//make drawing group zoomable
		if (out.zoomExtent()) {
			svg.call(zoom()
				.scaleExtent(out.zoomExtent())
				.on('zoom', function (a, b, c) {
					const k = event.transform.k;
					const cs = ["gra", "bn_0", /*"bn_1", "bn_2", "bn_3",*/ "bn_co", "cntbn", "symbol"];
					for (let i = 0; i < cs.length; i++)
						svg.selectAll("." + cs[i]).style("stroke-width", function (d) {
							return (1 / k) + "px";
						});
					zg.attr("transform", event.transform);
				}));
		}

		return out;
	};




	/** 
	 * Buid an empty map template, based on the geometries only.
	*/
	out.buildMapTemplate = function () {

		//geo center and extent: if not specified, use the default one, or the compute one from the topojson bbox
		const dp = _defaultPosition[out.geo() + "_" + out.proj()];
		if (!out.geoCenter())
			if (dp) out.geoCenter(dp.geoCenter);
			else out.geoCenter([0.5 * (out._geoData.bbox[0] + out._geoData.bbox[2]), 0.5 * (out._geoData.bbox[1] + out._geoData.bbox[3])]);
		//pixel size (zoom level): if not specified, compute value from SVG dimensions and topojson geographical extent
		if (!out.pixSize())
			if (dp) out.pixSize(dp.widthGeo / out.width());
			else out.pixSize(Math.min((out._geoData.bbox[2] - out._geoData.bbox[0]) / out.width_, (out._geoData.bbox[3] - out._geoData.bbox[1]) / out.height_));

		//SVG drawing function
		//compute geo bbox from geocenter, pixsize and SVG dimensions
		const bbox = [out.geoCenter_[0] - 0.5 * out.pixSize_ * out.width_, out.geoCenter_[1] - 0.5 * out.pixSize_ * out.height_, out.geoCenter_[0] + 0.5 * out.pixSize_ * out.width_, out.geoCenter_[1] + 0.5 * out.pixSize_ * out.height_];
		const path = geoPath().projection(geoIdentity().reflectY(true).fitSize([out.width_, out.height_], getBBOXAsGeoJSON(bbox)));


		//decode topojson to geojson
		const gra = feature(out._geoData, out._geoData.objects.gra).features;
		const nutsRG = feature(out._geoData, out._geoData.objects.nutsrg).features;
		const nutsbn = feature(out._geoData, out._geoData.objects.nutsbn).features;
		const cntrg = feature(out._geoData, out._geoData.objects.cntrg).features;
		const cntbn = feature(out._geoData, out._geoData.objects.cntbn).features;

		//prepare drawing group
		const zg = out.svg().select("#zoomgroup");
		zg.selectAll("*").remove();

		//draw background rectangle
		zg.append("rect").attr("id", "sea").attr("x", -5 * out.width_).attr("y", -5 * out.height_)
			.attr("width", 11 * out.width_).attr("height", 11 * out.height_)
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
			if (cntbn)
				cg.append("g").attr("id", "g_coast_margin_cnt")
					.selectAll("path").data(cntbn).enter().filter(function (bn) { return bn.properties.co === "T"; })
					.append("path").attr("d", path);
			//nuts bn
			if (nutsbn)
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
		if (cntrg)
			zg.append("g").attr("id", "g_cntrg").selectAll("path").data(cntrg)
				.enter().append("path").attr("d", path)
				.attr("class", "cntrg")
				.style("fill", out.cntrgFillStyle_)
				.on("mouseover", function (rg) {
					select(this).style("fill", out.cntrgSelFillSty_);
					if (tooltip) tooltip.mouseover("<b>" + rg.properties.na + "</b>");
				}).on("mousemove", function () {
					if (tooltip) tooltip.mousemove();
				}).on("mouseout", function () {
					select(this).style("fill", out.cntrgFillStyle_);
					if (tooltip) tooltip.mouseout();
				});

		//draw NUTS regions
		if (nutsRG)
			zg.append("g").attr("id", "g_nutsrg").selectAll("path").data(nutsRG)
				.enter().append("path").attr("d", path)
				.attr("class", "nutsrg")
				.attr("fill", out.nutsrgFillStyle_)
				.on("mouseover", function (rg) {
					const sel = select(this);
					sel.attr("fill___", sel.attr("fill"));
					sel.attr("fill", out.nutsrgSelFillSty_);
					if (tooltip) tooltip.mouseover(out.tooltipText_(rg, out));
				}).on("mousemove", function () {
					if (tooltip) tooltip.mousemove();
				}).on("mouseout", function () {
					const sel = select(this);
					sel.attr("fill", sel.attr("fill___"));
					if (tooltip) tooltip.mouseout();
				});

		//draw country boundaries
		if (cntbn)
			zg.append("g").attr("id", "g_cntbn")
				.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
				.selectAll("path").data(cntbn)
				.enter().append("path").attr("d", path)
				.attr("class", function (bn) { return (bn.properties.co === "T") ? "bn_co" : "cntbn" })
				.style("stroke", function (bn) { return (bn.properties.co === "T") ? out.cntbnStroke_.co : out.cntbnStroke_.def })
				.style("stroke-width", function (bn) { (bn.properties.co === "T") ? out.cntbnStrokeWidth_.co : out.cntbnStrokeWidth_.def });

		//draw NUTS boundaries
		if (nutsbn) {
			nutsbn.sort(function (bn1, bn2) { return bn2.properties.lvl - bn1.properties.lvl; });
			zg.append("g").attr("id", "g_nutsbn")
				.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
				.selectAll("path").data(nutsbn).enter()
				.append("path").attr("d", path)
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
					if (bn.co === "T") return out.nutsbnStrokeWidth_.co;
					if (bn.lvl > 0) return out.nutsbnStrokeWidth_[bn.lvl];
					//if (bn.oth === "T") return out.nutsbnStrokeWidth_.oth || 1;
					return out.nutsbnStrokeWidth_[bn.lvl] || 0.2;
				});
		}

		//prepare group for proportional symbols, with nuts region centroids
		if (withCenterPoints) {
			const gcp = zg.append("g").attr("id", "g_ps");

			//allow for different symbols by adding a g element here, then adding the symbols in proportional-symbols.js
			gcp.selectAll("g")
				.data(nutsRG/*.sort(function (a, b) { return b.properties.val - a.properties.val; })*/)
				.enter() //.filter(function (d) { return d.properties.val; })
				.append("g")
				.attr("transform", function (d) { return "translate(" + path.centroid(d) + ")"; })
				//.attr("r", 1)
				.attr("class", "symbol")
				.style("fill", "gray")
				.on("mouseover", function (rg) {
					select(this).style("fill", out.nutsrgSelFillSty_);
					if (tooltip) { tooltip.mouseover(out.tooltipText_(rg, out)); }
				}).on("mousemove", function () {
					if (tooltip) tooltip.mousemove();
				}).on("mouseout", function () {
					select(this).style("fill", out.psFill_);
					if (tooltip) tooltip.mouseout();
				});
		}


		//title
		if (out.title()) {
			//define default position
			if (!out.titlePosition()) out.titlePosition([10, 5 + out.titleFontSize()]);
			//draw title
			out.svg().append("text").attr("id", "title").attr("x", out.titlePosition()[0]).attr("y", out.titlePosition()[1])
				.text(out.title())
				.style("font-family", out.titleFontFamily())
				.style("font-size", out.titleFontSize())
				.style("font-weight", out.titleFontWeight())
				.style("fill", out.titleFill())
		}

		//bottom text
		if (out.bottomText())
			out.svg().append("text").attr("id", "bottomtext").attr("x", out.botTxtPadding_).attr("y", out.height_ - out.botTxtPadding_)
				.text(out.bottomText())
				.style("font-family", out.botTxtFontFamily_)
				.style("font-size", out.botTxtFontSize_)
				.style("fill", out.botTxtFill_)
				.on("mouseover", function () {
					tooltip.mw___ = tooltip.style("max-width");
					tooltip.f___ = tooltip.style("font");
					tooltip.style("max-width", "800px");
					tooltip.style("font", "6px");
					if (out.botTxtTooltipTxt_) tooltip.mouseover(out.botTxtTooltipTxt_);
				}).on("mousemove", function () {
					if (out.botTxtTooltipTxt_) tooltip.mousemove();
				}).on("mouseout", function () {
					if (out.bottomTextTooltipTxt_) tooltip.mouseout();
					tooltip.style("max-width", tooltip.mw___);
					tooltip.style("font", tooltip.f___);
				});

		//prepare map tooltip
		const tooltip = (out.tooltipText_ || out.botTxtTooltipTxt_) ? tp.tooltip() : null;

        return out;
	};

    return out;
}



/**
 * Default geocenter positions and width (in projection unit) for territories and projections.
 */
const _defaultPosition = {
	"EUR_3035": { geoCenter: [4970000, 3350000], widthGeo: 5200000 },
	//TODO add others
}
