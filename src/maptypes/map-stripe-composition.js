import { select, arc, pie } from "d3";
import { schemeCategory10 } from "d3-scale-chromatic";
//schemeSet3 schemeDark2 schemePastel1 schemeTableau10
import * as smap from '../core/stat-map';
import * as lgscomp from '../legend/legend-stripe-composition';

/**
 * Return a stripe composition map.
 * 
 * @param {*} config 
 */
export const map = function (config) {

	//create map object to return, using the template
	const out = smap.statMap(config);

	//width of the stripes serie
	out.stripeWidth_ = 50;
	//orientation - vertical by default
	out.stripeOrientation_ = 0;

	//colors - indexed by category code
	out.catColors_ = undefined;
	//colors - indexed by category code
	out.catLabels_ = undefined;

	//show stripes only when data for all categories is complete.
	//Otherwise, consider the regions as being with no data at all.
	out.showOnlyWhenComplete_ = false;
	//style for no data regions
	out.noDataFillStyle_ = "darkgray";

	//category label text, to be used in the legend for example
	out.labelText_ = {};


    /**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	["stripeWidth_", "stripeOrientation_", "catColors_", "catLabels_", "showOnlyWhenComplete_", "noDataFillStyle_", "labelText_"]
		.forEach(function (att) {
			out[att.substring(0, att.length - 1)] = function(v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
		});

	//override attribute values with config values
	if(config) ["stripeWidth", "stripeOrientation", "catColors", "catLabels", "showOnlyWhenComplete", "noDataFillStyle", "labelText"].forEach(function (key) {
		if(config[key]!=undefined) out[key](config[key]);
	});


	/**
	 * A function to define a stripe map easily, without repetition of information.
	 * Only for eurobase data sources.
	 * 
	 * @param {*} stat A pattern for the stat data source
	 * @param {String} dim The dimension of the composition.
	 * @param {Array} codes The category codes of the composition
	 * @param {Array} labels Optional: The labels for the category codes
	 * @param {Array} colors Optional: The colors for the category
	 */
	out.statComp = function(stat, dim, codes, labels, colors) {

		//add one dataset config for each category
		stat.filters = stat.filters || {};
		for(let i=0; i<codes.length; i++) {

			//category code
			const code = codes[i]
			stat.filters[dim] = code
			const sc_ = {};
			for(let key in stat) sc_[key] = stat[key]
			sc_.filters = {};
			for(let key in stat.filters) sc_.filters[key] = stat.filters[key]
			out.stat(code, sc_)

			//if specified, retrieve and assign color
			if(colors) {
				out.catColors_ = out.catColors_ || {};
				out.catColors_[code] = colors[i];
			}
			//if specified, retrieve and assign label
			if(labels) {
				out.catLabels_ = out.catLabels_ || {};
				out.catLabels_[code] = labels[i];
			}
		}

		//set statCodes
		statCodes = codes;

		return out;
	}


	/** The codes of the categories to consider for the composition. */
	let statCodes = undefined;

	/**
	 * Function to compute composition for region id, for each category.
	 * Return an object with, for each category, the share [0,1] of the category.
	 * @param {*} id 
	 */
	const getComposition = function(id) {
		let comp = {}, sum = 0;
		//get stat value for each category. Compute the sum.
		for(let i=0; i<statCodes.length; i++) {

			//retrieve code and stat value
			const sc = statCodes[i]
			const s = out.statData(sc).get(id);

			//case when some data is missing
			if(!s || (s.value!=0 && !s.value) || isNaN(s.value)) {
				if(out.showOnlyWhenComplete()) return undefined;
				else continue;
			}

			comp[sc] = s.value;
			sum += s.value;
		}

		//case when no data
		if(sum == 0) return undefined;

		//compute ratios
		for(let i=0; i<statCodes.length; i++) comp[statCodes[i]] /= sum;

		return comp;
	}



	//@override
	out.updateClassification = function () {

		//if not provided, get list of stat codes from the map stat data
		if(!statCodes) {
			//get list of stat codes.
			statCodes = Object.keys(out.statData_);
			//remove "default", if present
			const index = statCodes.indexOf("default");
			if (index > -1) statCodes.splice(index, 1);
		}

		return out;
	};


	//@override
	out.updateStyle = function () {

		//if not specified, build default color ramp
		if(!out.catColors()) {
			out.catColors({});
			for(let i=0; i<statCodes.length; i++)
				out.catColors()[statCodes[i]] = schemeCategory10[i%12];
		}

		//if not specified, initialise category labels
		out.catLabels_ = out.catLabels_ || {};

		//build and assign texture to the regions
		out.svg().selectAll("path.nutsrg")
			.attr("fill", function (d) {
				const id = d.properties.id;

				//compute composition
				const composition = getComposition(id);

				//case when no or missing data
				if (!composition) return out.noDataFillStyle() || "gray";

				//make stripe pattern
				const patt = out.svg().append("pattern")
					.attr("id", "pattern_" + id).attr("x", "0").attr("y", "0")
					.attr("width", out.stripeWidth()).attr("height", 1).attr("patternUnits", "userSpaceOnUse");
				//use orientation, if specified
				if(out.stripeOrientation()) patt.attr("patternTransform", "rotate("+out.stripeOrientation()+")")

				//background
				patt.append("rect").attr("x", 0).attr("y", 0).attr("width", out.stripeWidth()).attr("height", 1)
				.style("stroke", "none").style("fill", "lightgray")

				//make stripes, one per category
				let x=0;
				for(let code in composition) {

					//get stripe size
					let dx = composition[code]
					if(!dx) continue;
					dx *= out.stripeWidth();

					//get stripe color
					const col = out.catColors()[code] || "lightgray";

					//add stripe to pattern: a thin rectangle
					patt.append("rect").attr("x", x).attr("y", 0)
						.attr("height", 1)
						.style("stroke", "none")
						.attr("code", code)
						.style("fill", col)
						//transition along x
						.transition().duration(out.transitionDuration())
						.attr("width", dx)
					x += dx;
				}

				//return pattern reference
				return "url(#pattern_" + id + ")"
			})
			.attr("nd", function (d) {
				return ! getComposition(d.properties.id) ? "nd" : "";
			})

		return out;
	};

	//@override
	out.getLegendConstructor = function() {
		return lgscomp.legend;
	}


	//specific tooltip text function
	out.tooltipText_ =  function (rg, map) {

		//get tooltip
		const tp = select("#tooltip_eurostat")

		//clear
		tp.html("")
		tp.selectAll("*").remove();

		//write region name
		tp.append("div").html("<b>" + rg.properties.na + "</b><br>");

		//prepare pie chart data
		const data = []
		const comp = getComposition(rg.properties.id);
		for(const key in comp) data.push({ code:key, value:comp[key] })

		//case of regions with no data
		if(!data || data.length == 0) {
			tp.append("div").html( out.noDataText() );
			return;
		};

		//create svg for pie chart
		const radius = 40, inRadius = 15;
		const svg = tp.append("svg").attr("viewBox", [-radius, -radius, 2*radius, 2*radius]).attr("width", 2*radius);

		//make pie chart. See https://observablehq.com/@d3/pie-chart
		const pie_ = pie().sort(null).value(d => d.value)
		svg.append("g")
		.attr("stroke", "white")
		.selectAll("path")
		.data( pie_(data) )
		.join("path")
		.attr("fill", d => { return out.catColors()[d.data.code] || "lightgray"} )
		.attr("d", arc().innerRadius(inRadius).outerRadius(radius) )
	};

	return out;
}
