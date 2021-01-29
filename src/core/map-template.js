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
export const mapTemplate = function (config, withCenterPoints) {

	//build map template object
	const out = {};

	//map
	out.svgId_ = "map";
	out.svg_ = undefined;
	out.width_ = 800;
	out.height_ = 0;

	//geographical focus
	out.nutsLvl_ = 3;
	out.nutsYear_ = 2016;
	out.geo_ = "EUR";
	out.proj_ = "3035";
	out.scale_ = "20M"; //TODO choose automatically, depending on pixSize ?
	out.geoCenter_ = undefined;
	out.pixSize_ = undefined;
	out.zoomExtent_ = undefined;

	//map title
	out.title_ = "";
	out.titleFontSize_ = 25;
	out.titleFill_ = "black";
	out.titlePosition_ = undefined;
	out.titleFontFamily_ = "Helvetica, Arial, sans-serif";
	out.titleFontWeight_ = "bold";

	//labelling (country names and geographical features)
	out.labelling_ = false;
	out.labelFill_ = { "seas": "#003399", "countries": "#383838" };
	out.labelOpacity_ = { "seas": 1, "countries": 0.8 };
	out.labelFontSize_ = { "seas": 12, "countries": 12 };
	out.labelFontFamily_ = "Helvetica, Arial, sans-serif";

	//map frame
	out.frameStroke_ = "#222";
	out.frameStrokeWidth_ = 2;

	//tooltip
	//the function returning the tooltip text
	out.tooltipText_ = (rg => { return rg.properties.na; });
	out.tooltipShowFlags_ = "short"; //"short" "long"

	//template default style
	//nuts
	out.nutsrgFillStyle_ = "#eee";
	out.nutsrgSelFillSty_ = "purple";
	out.nutsbnStroke_ = { 0: "#777", 1: "#777", 2: "#777", 3: "#777", oth: "#444", co: "#1f78b4" };
	out.nutsbnStrokeWidth_ = { 0: 1, 1: 0.2, 2: 0.2, 3: 0.2, oth: 1, co: 1 };
	//countries
	out.cntrgFillStyle_ = "#eeeeee";
	out.cntrgSelFillSty_ = undefined; //"darkgray";
	out.cntbnStroke_ = { def: "none", co: "#1f78b4" }; //{ def: "#777", co: "#1f78b4" }
	out.cntbnStrokeWidth_ = { def: 0, co: 1 } //{ def: 1, co: 1 }
	//sea
	out.seaFillStyle_ = "white";//"#b3cde3";
	out.drawCoastalMargin_ = true;
	out.coastalMarginColor_ = "#c2daed";
	out.coastalMarginWidth_ = 5;
	out.coastalMarginStdDev_ = 2;
	//graticule
	out.drawGraticule_ = true;
	out.graticuleStroke_ = "lightgray";
	out.graticuleStrokeWidth_ = 1;

	//default copyright and disclaimer text
	out.bottomText_ = "Administrative boundaries: \u00A9EuroGeographics \u00A9UN-FAO \u00A9INSTAT \u00A9Turkstat"; //"(C)EuroGeographics (C)UN-FAO (C)Turkstat";
	out.botTxtFontSize_ = 12;
	out.botTxtFill_ = "black";
	out.botTxtFontFamily_ = "Helvetica, Arial, sans-serif";
	out.botTxtPadding_ = 10;
	out.botTxtTooltipTxt_ = "The designations employed and the presentation of material on this map do not imply the expression of any opinion whatsoever on the part of the European Union concerning the legal status of any country, territory, city or area or of its authorities, or concerning the delimitation of its frontiers or boundaries. Kosovo*: This designation is without prejudice to positions on status, and is in line with UNSCR 1244/1999 and the ICJ Opinion on the Kosovo declaration of independence. Palestine*: This designation shall not be construed as recognition of a State of Palestine and is without prejudice to the individual positions of the Member States on this issue.";

	out.nuts2jsonBaseURL_ = "https://raw.githubusercontent.com/eurostat/Nuts2json/master/pub/v1/";


	/**
	 * Insets.
	 * The map template has a recursive structure.
	 */

	//insets to show, as a list of map template configs. Ex.: [{geo:"MT"},{geo:"LI"},{geo:"PT20"}]
	out.insets_ = [];
	//inset templates - each inset is a map-template instance.
	out.insetTemplates_ = {};

	out.insetBoxPosition_ = undefined;
	out.insetBoxPadding_ = 5;
	out.insetBoxWidth_ = 210;
	out.insetZoomExtent_ = [1, 3];
	out.insetScale_ = "03M";

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	for (const att in out)
		out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };

	//special ones which affect also the insets
	["tooltipText_"]
		.forEach(function (att) {
			out[att.substring(0, att.length - 1)] = function (v) {
				if (!arguments.length) return out[att];
				out[att] = v;
				//recursive call to inset components
				for (const geo in out.insetTemplates_) {
					out.insetTemplates_[geo][att.substring(0, att.length - 1)](v);
				}
				return out;
			};
		}
		);

	//title getter and setter
	out.title = function (v) {
		if (!arguments.length) return out.title_;
		out.title_ = v;
		if (out.svg()) out.svg().select("#title" + out.geo()).text(v);
		return out;
	};

	//insets getter/setter
	out.insets = function () {
		if (!arguments.length) return out.insets_;
		if (arguments.length == 1 && arguments[0] === "default") out.insets_ = "default";
		else if (arguments.length == 1 && Array.isArray(arguments[0])) out.insets_ = arguments[0];
		else out.insets_ = arguments;
		return out;
	}


	/**
	 * geo data, as the raw topojson object returned by nuts2json API
	 */
	let geoData = undefined;

	/** */
	out.isGeoReady = function () {
		if (!geoData) return false;
		//recursive call to inset components
		for (const geo in out.insetTemplates_)
			if (!out.insetTemplates_[geo].isGeoReady()) return false;
		return true;
	}

	/**
	 * Return promise for Nuts2JSON topojson data.
	 */
	out.getGeoDataPromise = function () {
		const buf = [];
		buf.push(out.nuts2jsonBaseURL_);
		buf.push(out.nutsYear_);
		if (out.geo_ != "EUR") buf.push("/" + this.geo_);
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
		geoData = null;

		//get geo data from Nuts2json API
		out.getGeoDataPromise().then(function (geo___) {
			geoData = geo___;

			//build map template
			out.buildMapTemplate();

			//callback
			callback();
		});

		//recursive call to inset components
		for (const geo in out.insetTemplates_)
			out.insetTemplates_[geo].updateGeoMT(callback);

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
		const dg = svg.insert("g", ":first-child").attr("id", "drawing");

		//create main zoom group
		const zg = dg.append("g").attr("id", "zoomgroup" + out.geo_);

		//insets
		if (!out.insetBoxPosition_) out.insetBoxPosition_ = [out.width() - out.insetBoxWidth() - 2 * out.insetBoxPadding(), 2 * out.insetBoxPadding()];
		const ing = dg.append("g").attr("id", "insetsgroup").attr("transform", "translate(" + out.insetBoxPosition()[0] + "," + out.insetBoxPosition()[1] + ")")
		//if needed, use default inset setting
		if (out.insets_ === "default") out.insets_ = defaultInsetConfig(out.insetBoxWidth(), out.insetBoxPadding());
		for (let i = 0; i < out.insets_.length; i++) {
			const config = out.insets_[i];
			config.svgId = config.svgId || "inset" + config.geo + (Math.random().toString(36).substring(7));

			//get svg element. Create it if it as an embeded SVG if it does not exists
			let svg = select("#" + config.svgId);
			if (svg.size() == 0) {
				const x = config.x == undefined ? out.insetBoxPadding_ : config.x;
				const y = config.y == undefined ? out.insetBoxPadding_ + i * (out.insetBoxPadding_ + out.insetBoxWidth_) : config.y;
				const ggeo = ing.append("g").attr("id", "zoomgroup" + config.geo).attr("transform", "translate(" + x + "," + y + ")");
				ggeo.append("svg").attr("id", config.svgId);
			}

			//build inset
			out.insetTemplates_[config.geo] = buildInset(config, out).buildMapTemplateBase();

		}

		//draw frame
		dg.append("rect").attr("id", "frame" + out.geo_).attr("x", 0).attr("y", 0)
			.attr("width", out.width_).attr("height", out.height_)
			.style("stroke-width", out.frameStrokeWidth_)
			.style("stroke", out.frameStroke_)
			.style("fill", "none");

		//make drawing group zoomable
		if (out.zoomExtent()) {
			svg.call(zoom()
				.scaleExtent(out.zoomExtent())
				.on('zoom', function () {
					const k = event.transform.k;
					const cs = ["gra", "bn_0", /*"bn_1", "bn_2", "bn_3",*/ "bn_co", "cntbn", "symbol"];
					for (let i = 0; i < cs.length; i++)
						out.svg().selectAll("." + cs[i]).style("stroke-width", function (d) {
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
			else out.geoCenter([0.5 * (geoData.bbox[0] + geoData.bbox[2]), 0.5 * (geoData.bbox[1] + geoData.bbox[3])]);
		//pixel size (zoom level): if not specified, compute value from SVG dimensions and topojson geographical extent
		if (!out.pixSize())
			if (dp) out.pixSize(dp.pixSize * 800 / out.width());
			else out.pixSize(Math.min((geoData.bbox[2] - geoData.bbox[0]) / out.width_, (geoData.bbox[3] - geoData.bbox[1]) / out.height_));

		//SVG drawing function
		//compute geo bbox from geocenter, pixsize and SVG dimensions
		const bbox = [out.geoCenter_[0] - 0.5 * out.pixSize_ * out.width_, out.geoCenter_[1] - 0.5 * out.pixSize_ * out.height_, out.geoCenter_[0] + 0.5 * out.pixSize_ * out.width_, out.geoCenter_[1] + 0.5 * out.pixSize_ * out.height_];
		const projection = geoIdentity().reflectY(true).fitSize([out.width_, out.height_], getBBOXAsGeoJSON(bbox));
		const path = geoPath().projection(projection);


		//decode topojson to geojson
		const gra = feature(geoData, geoData.objects.gra).features;
		const nutsRG = feature(geoData, geoData.objects.nutsrg).features;
		const nutsbn = feature(geoData, geoData.objects.nutsbn).features;
		const cntrg = feature(geoData, geoData.objects.cntrg).features;
		const cntbn = feature(geoData, geoData.objects.cntbn).features;

		//RS
		if (cntrg && (out.nutsYear() + "" === "2016" || out.nutsYear() + "" === "2021"))
			for (let i = 0; i < cntrg.length; i++) {
				const c = cntrg[i];
				if (c.properties.id == "RS") c.properties.na = "Kosovo (UNSCR 1244/1999 & ICJ)";
			}

		//prepare drawing group
		const zg = out.svg().select("#zoomgroup" + out.geo_);
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
		if (cntrg) {
			const a = zg.append("g").attr("id", "g_cntrg").selectAll("path").data(cntrg)
				.enter().append("path").attr("d", path)
				.attr("class", "cntrg")
				.style("fill", out.cntrgFillStyle_)
			if(out.cntrgSelFillSty())
				a.on("mouseover", function (rg) {
					select(this).style("fill", out.cntrgSelFillSty());
					if (tooltip) tooltip.mouseover("<b>" + rg.properties.na + "</b>");
				}).on("mousemove", function () {
					if (tooltip) tooltip.mousemove();
				}).on("mouseout", function () {
					select(this).style("fill", out.cntrgFillStyle_);
					if (tooltip) tooltip.mouseout();
				});
		}

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
					if (tooltip) tooltip.mouseover(out.tooltipText_(rg, out))
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
					if (tooltip) tooltip.mouseover(out.tooltipText_(rg, out))
				}).on("mousemove", function () {
					if (tooltip) tooltip.mousemove();
				}).on("mouseout", function () {
					select(this).style("fill", out.psFill_);
					if (tooltip) tooltip.mouseout();
				});
		}

		// add geographical labels to map
		if (out.labelling_) {
			addLabelsToMap(out, zg, projection)
		}

		//title
		if (out.title()) {
			//define default position
			if (!out.titlePosition()) out.titlePosition([10, 5 + out.titleFontSize()]);
			//draw title
			out.svg().append("text").attr("id", "title" + out.geo_).attr("x", out.titlePosition()[0]).attr("y", out.titlePosition()[1])
				.text(out.title())
				.style("font-family", out.titleFontFamily())
				.style("font-size", out.titleFontSize())
				.style("font-weight", out.titleFontWeight())
				.style("fill", out.titleFill())

				.style("stroke-width", 3)
				.style("stroke", "lightgray"/*out.seaFillStyle()*/)
				.style("stroke-linejoin", "round")
				.style("paint-order", "stroke")
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


	/**
	 * @function addLabelsToMap 
	 * @description appends text labels of country and ocean names to the map
	*/
	function addLabelsToMap(out, zg, projection) {
		let labels = out.labelsConfig_ || _defaultLabels;
		let language = out.lg_;
		let data;
		if (labels[out.geo_ + "_" + out.proj_][language]) {
			data = labels[out.geo_ + "_" + out.proj_][language];
		} else {
			//if geo doesnt have labels in the chosen language, fall back to english
			//this helps save space by not including labels in other languages that are spelt the same in english
			data = labels[out.geo_ + "_" + out.proj_].en;
		}
		const labelg = zg.append("g").attr("id", "g_geolabels");
		labelg.selectAll("text")
			.data(data)
			.enter()
			.append("text") // append text
			.attr("class", (d) => { return "geolabel_" + d.class })
			.attr("x", function (d) {
				if (d.rotate) {
					return 0; //for rotated text, x and y positions must be specified in the transform property
				}
				return projection([d.x, d.y])[0];
			})
			.attr("y", function (d) {
				if (d.rotate) {
					return 0; //for rotated text, x and y positions must be specified in the transform property
				}
				return projection([d.x, d.y])[1];
			})
			.attr("dy", -7) // set y position of bottom of text
			.style("opacity", d => d.class == "seas" ? out.labelOpacity_.seas : out.labelOpacity_.countries)
			.style("letter-spacing", d => d.letterSpacing ? d.letterSpacing : 0)
			.style("fill", d => d.class == "seas" ? out.labelFill_.seas : out.labelFill_.countries)
			.style("font-size", (d) => {
				if (d.size == "large") {
					return out.labelFontSize_[d.class] + "px";
				} else if (d.size == "medium") {
					return out.labelFontSize_[d.class] / 1.25 + "px";
				} else if (d.size == "small") {
					return out.labelFontSize_[d.class] / 1.7 + "px";
				} else if (d.size == "xsmall") {
					return out.labelFontSize_[d.class] / 2.6 + "px";
				} else {
					return out.labelFontSize_[d.class] + "px";
				}
			})
			//transform labels which have a "rotate" property in the labels config. For rotated labels, their X,Y must also be set in the transform
			.attr("transform", (d) => {
				if (d.rotate) {
					let pos = projection([d.x, d.y])
					let x = pos[0];
					let y = pos[1];
					return `translate(${x},${y}) rotate(${d.rotate})`
				} else {
					return "rotate(0)"
				}
			})
			.style("font-weight", d => d.class == "seas" ? "normal" : "bold")
			.style("font-style", d => d.class == "seas" ? "italic" : "normal")
			.style("pointer-events", "none")
			.style("font-family", out.labelFontFamily_)
			.attr("text-anchor", "middle") // set anchor y justification
			.text(function (d) { return d.text; }); // define the text to display

	}




	/** Build template for inset, based on main one */
	const buildInset = function (config, map) {
		//TODO find a better way to do that

		//copy map
		//for(let key__ in map) {
		//mt[key__] = map[key__];
		//}

		//const mt = Object.assign({}, map)

		const mt = mapTemplate(config, withCenterPoints);

		//define default values for inset configs
		config = config || {};
		config.proj = config.proj || _defaultCRS[config.geo];
		config.scale = config.scale || out.insetScale_;
		config.bottomText = config.bottomText || "";
		config.botTxtTooltipTxt = config.botTxtTooltipTxt || "";
		config.zoomExtent = config.zoomExtent || out.insetZoomExtent_;
		config.width = config.width || out.insetBoxWidth_;
		config.height = config.height || out.insetBoxWidth_;
		config.insets = config.insets || [];
		config.insetTemplates = config.insetTemplates || {};
		config.callback = config.callback || undefined;

		/*
		mt.stat_ = null;
		mt.legend_ = null;
		mt.filtersDefinitionFun_ = null;
		mt.tooltipText_ = null;*/

		//copy template attributes
		["nutsLvl_", "nutsYear_", "nutsrgFillStyle_", "nutsrgSelFillSty_", "nutsbnStroke_", "nutsbnStrokeWidth_", "cntrgFillStyle_", "cntrgSelFillSty_", "cntbnStroke_", "cntbnStrokeWidth_", "seaFillStyle_", "drawCoastalMargin_", "coastalMarginColor_", "coastalMarginWidth_", "coastalMarginStdDev_", "graticuleStroke_", "graticuleStrokeWidth_", "labelling_",
			"labelFill_", "labelOpacity_", "labelFontSize_", "labelFontFamily_", "lg_"]
			.forEach(function (att) { mt[att] = out[att]; });

		//copy stat map attributes/methods
		["stat", "statData", "legend", "legendObj", "noDataText", "lg", "transitionDuration", "tooltipText_", "classToText_"]
			.forEach(function (att) { mt[att] = out[att]; });

		//apply config values for inset
		for (let key in config) mt[key + "_"] = config[key];

		return mt;
	}


	return out;
}


/**
 * Default labels for country / geographical names.
 * Using centroids would clash with proportional symbols, and are generally not ideal placements, so labels are positioned independently 
 * Labels are provided for all supported languages (map.lg)
 */
const _defaultLabels = {
	"EUR_3035": {
		en: [
			{ text: "MEDITERRANEAN SEA", x: 5472000, y: 1200000, class: "seas", size: "large", letterSpacing: 7 },
			{ text: "ATLANTIC OCEAN", x: 2820000, y: 2540000, class: "seas", size: "large", letterSpacing: 2 },
			{ text: "NORTH SEA", x: 3915000, y: 3700000, class: "seas", size: "large" },
			{ text: "BALTIC SEA", x: 4900000, y: 3672000, class: "seas", size: "medium", rotate: -50 },
			{ text: "NORWEGIAN SEA", x: 3850000, y: 4800000, class: "seas", size: "large", letterSpacing: 1},
			{ text: "BLACK SEA", x: 6300000, y: 2500000, class: "seas", size: "large", letterSpacing: 4 },
			{ text: "ALBANIA", x: 5100000, y: 2060000, class: "countries", size: "small", rotate: 80 },
			{ text: "AUSTRIA", x: 4670000, y: 2629000, class: "countries", size: "medium" },
			{ text: "BELGIUM", x: 3900000, y: 3030000, class: "countries", size: "small", rotate: 30 },
			{ text: "BULGARIA", x: 5567000, y: 2256000, class: "countries", size: "large" },
			{ text: "CROATIA", x: 4876000, y: 2455000, class: "countries", size: "small" },
			{ text: "CYPRUS", x: 6426000, y: 1480000, class: "countries", size: "medium" },
			{ text: "CZECHIA", x: 4707000, y: 2885000, class: "countries", size: "large" },
			{ text: "DENMARK", x: 4316000, y: 3621000, class: "countries", size: "medium" },
			{ text: "ESTONIA", x: 5220000, y: 3990000, class: "countries", size: "small" },
			{ text: "FINLAND", x: 5150000, y: 4424000, class: "countries", size: "large" },
			{ text: "FRANCE", x: 3767740, y: 2662817, class: "countries", size: "large" },
			{ text: "GERMANY", x: 4347284, y: 3093276, class: "countries", size: "large" },
			{ text: "GREECE", x: 5470000, y: 1860000, class: "countries", size: "large" },
			{ text: "HUNGARY", x: 5020000, y: 2630000, class: "countries", size: "medium" },
			{ text: "ICELAND", x: 3040000, y: 4833000, class: "countries", size: "medium" },
			{ text: "IRELAND", x: 3136000, y: 3394000, class: "countries", size: "medium" },
			{ text: "ITALY", x: 4469967, y: 2181963, class: "countries", size: "large" },
			{ text: "LATVIA", x: 5290000, y: 3800000, class: "countries", size: "small" },
			{ text: "LITHUANIA", x: 5190000, y: 3630000, class: "countries", size: "small" },
			{ text: "LUX.", x: 4120000, y: 2940000, class: "countries", size: "small" },
			{ text: "MALTA", x: 4731000, y: 1330000, class: "countries", size: "small" },
			{ text: "MONT.", x: 5073000, y: 2185000, class: "countries", size: "xsmall" },
			{ text: "N. MACEDONIA", x: 5300000, y: 2082000, class: "countries", size: "xsmall" },
			{ text: "NETHERLANDS", x: 3977000, y: 3208000, class: "countries", size: "small" },
			{ text: "NORWAY", x: 4330000, y: 4147000, class: "countries", size: "large", rotate: -75 },
			{ text: "POLAND", x: 4964000, y: 3269000, class: "countries", size: "large" },
			{ text: "PORTUGAL", x: 2836136, y: 1956179, class: "countries", size: "medium", rotate: -75 },
			{ text: "ROMANIA", x: 5451000, y: 2600000, class: "countries", size: "large" },
			{ text: "SERBIA", x: 5200000, y: 2300000, class: "countries", size: "small" },
			{ text: "SLOVAKIA", x: 5040000, y: 2835000, class: "countries", size: "small", rotate: -30 },
			{ text: "SLOVENIA", x: 4735000, y: 2522000, class: "countries", size: "small", rotate: -30 },
			{ text: "SPAIN", x: 3160096, y: 1850000, class: "countries", size: "large" },
			{ text: "SWEDEN", x: 4670000, y: 4180000, class: "countries", size: "large", rotate: -75 },
			{ text: "SWITZERLAND", x: 4200000, y: 2564000, class: "countries", size: "small" },
			{ text: "TURKEY", x: 6510000, y: 2100000, class: "countries", size: "large" },
			{ text: "U.K.", x: 3558000, y: 3250000, class: "countries", size: "large" }
		],
		fr: [
			{ text: "MER MÉDITERRANÉE", x: 5472000, y: 1242000, class: "seas", size: "large" },
			{ text: "OCÈAN ATLANTIQUE", x: 2820000, y: 2540000, class: "seas", size: "large" },
			{ text: "MER DU NORD", x: 3915000, y: 3700000, class: "seas", size: "large" },
			{ text: "MER BALTIQUE", x: 4900000, y: 3672000, class: "seas", size: "medium", rotate: -50 },
			{ text: "MER DE NORVÈGE", x: 3850000, y: 4800000, class: "seas", size: "large" },
			{ text: "MER NOIRE", x: 6265000, y: 2472000, class: "seas", size: "large" },
			{ text: "ALBANIE", x: 5100000, y: 2060000, class: "countries", size: "small", rotate: 80 },
			{ text: "AUTRICHE", x: 4670000, y: 2629000, class: "countries", size: "medium" },
			{ text: "BELGIQUE", x: 3900000, y: 3030000, class: "countries", size: "small", rotate: 30 },
			{ text: "BULGARIE", x: 5567000, y: 2256000, class: "countries", size: "large" },
			{ text: "CROATIE", x: 4876000, y: 2455000, class: "countries", size: "small" },
			{ text: "CHYPRE", x: 6426000, y: 1480000, class: "countries", size: "medium" },
			{ text: "TCHÉQUIE", x: 4707000, y: 2885000, class: "countries", size: "large" },
			{ text: "DANEMARK", x: 4316000, y: 3621000, class: "countries", size: "medium" },
			{ text: "ESTONIE", x: 5220000, y: 3990000, class: "countries", size: "medium" },
			{ text: "FINLANDE", x: 5125000, y: 4424000, class: "countries", size: "large" },
			{ text: "FRANCE", x: 3767740, y: 2662817, class: "countries", size: "large" },
			{ text: "ALLEMAGNE", x: 4347284, y: 3093276, class: "countries", size: "large" },
			{ text: "GRÈCE", x: 5420000, y: 1860000, class: "countries", size: "large" },
			{ text: "HONGRIE", x: 5020000, y: 2654000, class: "countries", size: "medium" },
			{ text: "ISLANDE", x: 3040000, y: 4833000, class: "countries", size: "medium" },
			{ text: "IRLANDE", x: 3136000, y: 3394000, class: "countries", size: "medium" },
			{ text: "ITALIE", x: 4500000, y: 2181963, class: "countries", size: "large" },
			{ text: "LETTONIE", x: 5290000, y: 3776000, class: "countries", size: "medium" },
			{ text: "LITUANIE", x: 5190000, y: 3630000, class: "countries", size: "medium" },
			{ text: "LUX.", x: 4120000, y: 2940000, class: "countries", size: "small" },
			{ text: "MALTE", x: 4731000, y: 1335000, class: "countries", size: "small" },
			{ text: "MONT.", x: 5073000, y: 2185000, class: "countries", size: "xsmall" },
			{ text: "MAC. DU NORD", x: 5300000, y: 2082000, class: "countries", size: "xsmall" },
			{ text: "PAYS-BAS", x: 3977000, y: 3208000, class: "countries", size: "small" },
			{ text: "NORVEGE", x: 4330000, y: 4147000, class: "countries", size: "large", rotate: -75 },
			{ text: "POLOGNE", x: 4964000, y: 3269000, class: "countries", size: "large" },
			{ text: "PORTUGAL", x: 2836136, y: 1956179, class: "countries", size: "medium", rotate: -75 },
			{ text: "ROUMANIE", x: 5451000, y: 2600000, class: "countries", size: "large" },
			{ text: "SERBIE", x: 5200000, y: 2300000, class: "countries", size: "small" },
			{ text: "SLOVAQUIE", x: 5040000, y: 2835000, class: "countries", size: "small", rotate: -30 },
			{ text: "SLOVÉNIE", x: 4735000, y: 2522000, class: "countries", size: "small", rotate: -35 },
			{ text: "ESPAGNE", x: 3160096, y: 1850000, class: "countries", size: "large" },
			{ text: "SUÈDE", x: 4700000, y: 4401000, class: "countries", size: "large", rotate: -75 },
			{ text: "SUISSE", x: 4200000, y: 2564000, class: "countries", size: "small" },
			{ text: "TURQUIE", x: 6510000, y: 2100000, class: "countries", size: "large" },
			{ text: "ROYAUME-UNI", x: 3558000, y: 3250000, class: "countries", size: "medium" }
		],
		de: [
			{ text: "MITTELMEER", x: 5472000, y: 1200000, class: "seas", size: "large", letterSpacing: 7 },
			{ text: "ATLANTISCHER OZEAN", x: 2820000, y: 2540000, class: "seas", size: "large" },
			{ text: "NORDSEE", x: 3915000, y: 3700000, class: "seas", size: "large" },
			{ text: "OSTSEE", x: 4900000, y: 3672000, class: "seas", size: "medium", rotate: -50 },
			{ text: "NORWEGISCHE MEER", x: 3850000, y: 4800000, class: "seas", size: "large" },
			{ text: "SCHWARZE MEER", x: 6300000, y: 2500000, class: "seas", size: "large", letterSpacing: 1 },
			{ text: "ALBANIEN", x: 5100000, y: 2060000, class: "countries", size: "small", rotate: 80 },
			{ text: "ÖSTERREICH", x: 4650000, y: 2629000, class: "countries", size: "small" },
			{ text: "BELGIEN", x: 3900000, y: 3030000, class: "countries", size: "small", rotate: 30 },
			{ text: "BULGARIEN", x: 5567000, y: 2256000, class: "countries", size: "medium" },
			{ text: "KROATIEN", x: 4876000, y: 2455000, class: "countries", size: "small" },
			{ text: "ZYPERN", x: 6426000, y: 1480000, class: "countries", size: "medium" },
			{ text: "TSCHECHIEN", x: 4707000, y: 2885000, class: "countries", size: "small" },
			{ text: "DÄNEMARK", x: 4316000, y: 3621000, class: "countries", size: "medium" },
			{ text: "ESTLAND", x: 5220000, y: 3990000, class: "countries", size: "small" },
			{ text: "FINNLAND", x: 5150000, y: 4424000, class: "countries", size: "large" },
			{ text: "FRANKREICH", x: 3767740, y: 2662817, class: "countries", size: "large" },
			{ text: "DEUTSCHLAND", x: 4347284, y: 3093276, class: "countries", size: "medium" },
			{ text: "GRIECHENLAND", x: 5550000, y: 1500000, class: "countries", size: "medium" },
			{ text: "UNGARN", x: 5020000, y: 2630000, class: "countries", size: "medium" },
			{ text: "ISLAND", x: 3040000, y: 4833000, class: "countries", size: "medium" },
			{ text: "IRLAND", x: 3136000, y: 3394000, class: "countries", size: "medium" },
			{ text: "ITALIEN", x: 4469967, y: 2181963, class: "countries", size: "large", rotate:35 },
			{ text: "LETTLAND", x: 5290000, y: 3800000, class: "countries", size: "small" },
			{ text: "LITAUEN", x: 5190000, y: 3630000, class: "countries", size: "small" },
			{ text: "LUX.", x: 4120000, y: 2940000, class: "countries", size: "small" },
			{ text: "MALTA", x: 4731000, y: 1330000, class: "countries", size: "small" },
			{ text: "MONT.", x: 5073000, y: 2185000, class: "countries", size: "xsmall" },
			{ text: "NORDMAZEDONIEN", x: 5350000, y: 2082000, class: "countries", size: "xsmall" },
			{ text: "NIEDERLANDE", x: 3977000, y: 3208000, class: "countries", size: "small" },
			{ text: "NORWEGEN", x: 4330000, y: 4147000, class: "countries", size: "large", rotate: -75 },
			{ text: "POLEN", x: 4964000, y: 3269000, class: "countries", size: "large" },
			{ text: "PORTUGAL", x: 2836136, y: 1956179, class: "countries", size: "medium", rotate: -75 },
			{ text: "RUMÄNIEN", x: 5451000, y: 2600000, class: "countries", size: "large" },
			{ text: "SERBIEN", x: 5200000, y: 2300000, class: "countries", size: "small" },
			{ text: "SLOWAKEI", x: 5040000, y: 2835000, class: "countries", size: "small", rotate: -30 },
			{ text: "SLOWENIEN", x: 4735000, y: 2522000, class: "countries", size: "small", rotate: -30 },
			{ text: "SPANIEN", x: 3160096, y: 1850000, class: "countries", size: "large" },
			{ text: "SCHWEDEN", x: 4670000, y: 4180000, class: "countries", size: "large", rotate: -75 },
			{ text: "SCHWEIZ", x: 4200000, y: 2564000, class: "countries", size: "small" },
			{ text: "TRUTHAHN", x: 6510000, y: 2100000, class: "countries", size: "large" },
			{ text: "VEREINIGTES", x: 3550000, y: 3520000, class: "countries", size: "medium" },
			{ text: "KÖNIGREICH", x: 3550000, y: 3420000, class: "countries", size: "medium" } 
		],
	},
	"IC_32628": {
		en: [
			{ text: "Canary Islands", x: 420468, y: 3180647, class: "countries", size: "large" }
		],
		fr: [
			{ text: "Les îles Canaries", x: 420468, y: 3180647, class: "countries", size: "large" }
		],
		de: [
			{ text: "Kanarische Inseln", x: 410000, y: 3180647, class: "countries", size: "large" }
		]
	},
	"GP_32620": {
		en: [
			{ text: "Guadeloupe", x: 700000, y: 1810000, class: "countries", size: "large" },
		]
	},
	"MQ_32620": {
		en: [
			{ text: "Martinique", x: 716521, y: 1621322, class: "countries", size: "large" }
		]
	},
	"GF_32622": {
		en: [
			{ text: "Guyane", x: 266852, y: 444074, class: "countries", size: "large" }
		],
		de: [
			{ text: "Guayana", x: 266852, y: 444074, class: "countries", size: "large" }
		]
	},
	"RE_32740": {
		en: [
			{ text: "Réunion", x: 348011, y: 7680000, class: "countries", size: "medium" }
		]
	},
	"YT_32738": {
		en: [
			{ text: "Mayotte", x: 516549, y: 8593920, class: "countries", size: "medium" }
		]
	},
	"MT_3035": {
		en: [
			{ text: "Malta", x: 4719755, y: 1410701, class: "countries", size: "medium" }
		]
	},
	"PT20_32626": {
		en: [
			{ text: "Azores", x: 397418, y: 4320000, class: "countries", size: "medium" }
		],
		fr: [
			{ text: "Açores", x: 397418, y: 4271471, class: "countries", size: "medium" }
		],
		de: [
			{ text: "Azoren", x: 397418, y: 4271471, class: "countries", size: "medium" }
		]
	},
	"PT30_32628": {
		en: [
			{ text: "Madeira", x: 333586, y: 3624000, class: "countries", size: "medium", rotate: 30 }
		],
		fr: [
			{ text: "Madère", x: 333586, y: 3624000, class: "countries", size: "medium", rotate: 30 }
		]
	},
	"LI_3035": {
		en: [
			{ text: "Liechtenstein", x: 4287060, y: 2679000, class: "countries", size: "small" }
		],
	},
	"IS_3035": {
		en: [
			{ text: "Iceland", x: 3011804, y: 4960000, class: "countries", size: "large" }
		],
		fr: [
			{ text: "Islande", x: 3011804, y: 4960000, class: "countries", size: "large" }
		],
		de: [
			{ text: "Island", x: 3011804, y: 4960000, class: "countries", size: "large" }
		]
	},
	"SJ_SV_3035": {
		en: [
			{ text: "Svalbard", x: 4570000, y: 6260000, class: "countries", size: "medium" }
		],
		de: [
			{ text: "Spitzbergen", x: 4570000, y: 6260000, class: "countries", size: "small" }
		]
	},
	"SJ_JM_3035": {
		en: [
			{ text: "Jan Mayen", x: 3647762, y: 5420300, class: "countries", size: "small" }
		]
	},
	"CARIB_32620": {
		en: [
			{ text: "Guadeloupe", x: 700000, y: 1810000, class: "countries", size: "medium" },
			{ text: "Martinique", x: 570000, y: 1590000, class: "countries", size: "medium" },
			{ text: "Saint Martin", x: 597000, y: 1962000, class: "countries", size: "small" },
		]
	},
}


/** Default geocenter positions and pixSize (for default width = 800px) for territories and projections. */
const _defaultPosition = {
	"EUR_3035": { geoCenter: [4970000, 3350000], pixSize: 6800 },
	"IC_32628": { geoCenter: [443468, 3145647], pixSize: 1000 },
	"GP_32620": { geoCenter: [669498, 1784552], pixSize: 130 },
	"MQ_32620": { geoCenter: [716521, 1621322], pixSize: 130 },
	"GF_32622": { geoCenter: [266852, 444074], pixSize: 500 },
	"RE_32740": { geoCenter: [348011, 7661627], pixSize: 130 },
	"YT_32738": { geoCenter: [516549, 8583920], pixSize: 70 },
	"MT_3035": { geoCenter: [4719755, 1441701], pixSize: 70 },
	"PT20_32626": { geoCenter: [397418, 4271471], pixSize: 1500 },
	"PT30_32628": { geoCenter: [333586, 3622706], pixSize: 150 },
	"LI_3035": { geoCenter: [4287060, 2672000], pixSize: 40 },
	"IS_3035": { geoCenter: [3011804, 4960000], pixSize: 700 },
	"SJ_SV_3035": { geoCenter: [4570000, 6160156], pixSize: 800 },
	"SJ_JM_3035": { geoCenter: [3647762, 5408300], pixSize: 100 },
	"CARIB_32620": { geoCenter: [636345, 1669439], pixSize: 500 },
}

/**
 * Default inset setting.
 * @param {*} s The width of the inset box
 * @param {*} p The padding
 */
const defaultInsetConfig = function (s, p) {
	const out = [
		{ geo: "IC", x: 0, y: 0, width: s, height: 0.3 * s },
		{ geo: "CARIB", x: 0, y: 0.3 * s + p, width: 0.5 * s, height: s },
		{ geo: "GF", x: 0.5 * s, y: 0.3 * s + p, width: 0.5 * s, height: 0.75 * s }, { geo: "YT", x: 0.5 * s, y: 1.05 * s + p, width: 0.25 * s, height: 0.25 * s }, { geo: "RE", x: 0.75 * s, y: 1.05 * s + p, width: 0.25 * s, height: 0.25 * s },
		{ geo: "PT20", x: 0, y: 1.3 * s + 2 * p, width: 0.75 * s, height: 0.25 * s }, { geo: "PT30", x: 0.75 * s, y: 1.3 * s + 2 * p, width: 0.25 * s, height: 0.25 * s },
		{ geo: "MT", x: 0, y: 1.55 * s + 3 * p, width: 0.25 * s, height: 0.25 * s }, { geo: "LI", x: 0.25 * s, y: 1.55 * s + 3 * p, width: 0.25 * s, height: 0.25 * s },
		{ geo: "SJ_SV", x: 0.5 * s, y: 1.55 * s + 3 * p, width: 0.25 * s, height: 0.25 * s }, { geo: "SJ_JM", x: 0.75 * s, y: 1.55 * s + 3 * p, width: 0.25 * s, height: 0.25 * s },
		/*{geo:"IC", x:0, y:0}, {geo:"RE", x:dd, y:0}, {geo:"YT", x:2*dd, y:0},
		{geo:"GP", x:0, y:dd}, {geo:"MQ", x:dd, y:dd}, {geo:"GF",scale:"10M", x:2*dd, y:dd},
		{geo:"PT20", x:0, y:2*dd}, {geo:"PT30", x:dd, y:2*dd}, {geo:"MT", x:2*dd, y:2*dd},
		{geo:"LI",scale:"01M", x:0, y:3*dd}, {geo:"SJ_SV", x:dd, y:3*dd}, {geo:"SJ_JM",scale:"01M", x:2*dd, y:3*dd},*/
		//{geo:"CARIB", x:0, y:330}, {geo:"IS", x:dd, y:330}
	];
	//hide graticule for insets
	for (let i = 0; i < out.length; i++) out[i].drawGraticule = false;
	return out;
}



/** Default CRS for each geo area */
const _defaultCRS = {
	"EUR": "3035",
	"IC": "32628",
	"GP": "32620",
	"MQ": "32620",
	"GF": "32622",
	"RE": "32740",
	"YT": "32738",
	"MT": "3035",
	"PT20": "32626",
	"PT30": "32628",
	"LI": "3035",
	"IS": "3035",
	"SJ_SV": "3035",
	"SJ_JM": "3035",
	"CARIB": "32620",
};


