import { color } from "d3-color";
import { scaleQuantile } from "d3-scale";
import * as smap from '../core/stat-map';
//import * as lgch from '../legend/legend-choropleth';

/**
 * Return a bivariate choropleth map.
 * See:
 * - https://gistbok.ucgis.org/bok-topics/multivariate-mapping
 * - http://andywoodruff.com/blog/how-to-make-a-value-by-alpha-map/ and https://bl.ocks.org/awoodruff/857b5b0bf170b236787b
 * - https://www.slideshare.net/ESRI/arcgis-extensions?next_slideshow=1
 * - https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3173776/
 * 
 * @param {*} config 
 */
export const map = function (config) {

	//create map object to return, using the template
	const out = smap.statMap(config);

	out.clnb_ = 3;
	out.startColor_ = "white"
	out.endColor1_ = "blue"
	out.endColor2_ = "red"

	//The color function for variable 1 (from [0,1] to color)
	//out.colorFun1_ = dsc.interpolateGreys;
	//The exageration exponant for variable 1: 1 for linear, <<1 to exagerate small values, >>1 to exagerate large values.
	//out.exponant1_ = 1;
	//The color function for variable 2 (from [0,1] to color)
	//out.colorFun2_ = dsc.interpolateYlOrRd;
	//The exageration exponant for variable 2: 1 for linear, <<1 to exagerate small values, >>1 to exagerate large values.
	//out.exponant2_ = 1;

	//style for no data regions
	out.noDataFillStyle_ = "darkgray";
	//the classifier: a function which return a class number from a stat value.
	out.classifier_ = undefined;
	//specific tooltip text function
	out.tooltipText_ = tooltipTextFunBiv;


    /**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	["clnb_", "startColor_", "endColor1_", "endColor2_", "noDataFillStyle_", "classifier_"]
		.forEach(function (att) {
			out[att.substring(0, att.length - 1)] = function(v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
		});

	//override attribute values with config values
	if(config) ["clnb", "startColor", "endColor1", "endColor2", "noDataFillStyle"].forEach(function (key) {
		if(config[key]!=undefined) out[key](config[key]);
	});

	//@override
	out.updateClassification = function () {

		//get stat data
		const s1 = out.statData("v1");
		const s2 = out.statData("v2");

		//define bivariate scale
		const scale = scaleBivariate(out.clnb(), s1.getArray(), s2.getArray(), out.startColor(), out.endColor1(), out.endColor2());

		//store as classifier
		out.classifier(scale);

		return out;
	};


	//@override
	out.updateStyle = function () {

		//apply colors
		out.svg().selectAll("path.nutsrg")
			.transition().duration(out.transitionDuration())
			.attr("fill", function (rg) {

				//get v1 value
				const sv1 = out.statData("v1").getValue(rg.properties.id);
				if(!sv1) return out.noDataFillStyle();

				//get v2 value
				const sv2 = out.statData("v2").getValue(rg.properties.id);
				if(!sv2) return out.noDataFillStyle();

				return out.classifier()(sv1, sv2)
			})
		return out;

	};

	/*/@override
	out.getLegendConstructor = function() {
		return lgch.legendChoropleth;
	}*/

	return out;
}


/**
 * Return a bivariate classifier.
 * 
 * @param {*} domain1 The [min,max] interval of variable 1
 * @param {*} colorFun1 The color function for variable 1 (from [0,1] to color)
 * @param {*} exponant1 The exageration exponant for variable 1: 1 for linear, <<1 to exagerate small values, >>1 to exagerate large values.
 * @param {*} domain2 The [min,max] interval of variable 2
 * @param {*} colorFun2 The color function for variable 2 (from [0,1] to color)
 * @param {*} exponant2 The exageration exponant for variable 2: 1 for linear, <<1 to exagerate small values, >>1 to exagerate large values.
 */
const scaleBivariate = function(clnb, domain1, domain2, startColor, endColor1, endColor2) {

	//make color scales
	const s1 = scalePow().exponent(exponant1).domain(domain1)
	const s2 = scalePow().exponent(exponant2).domain(domain2)
	//TODO what happen for negative stat values?

	return function(v1, v2) {

		//get rgba colors
		const col1 = colorFun1(s1(v1)), col2 = colorFun2(s2(v2));

		//get d3 color
		const c1 = color(col1), c2 = color(col2)

		//return middle color
		return "rgba("
			+ Math.round( 0.5*(c1.r+c2.r) ) + ","
			+ Math.round( 0.5*(c1.g+c2.g) ) + ","
			+ Math.round( 0.5*(c1.b+c2.b) ) + ","
			+ Math.round( 0.5*(c1.opacity+c2.opacity) )+")";
	}
  }

const alpha = function(r,g,b) {
	return function(t) {
		return "rgba("+r+","+g+","+b+","+ Math.round(255*t) +")";
	}
}


/**
 * Specific function for tooltip text.
 * 
 * @param {*} rg The region to show information on.
 * @param {*} map The map element
 */
const tooltipTextFunBiv = function (rg, map) {
	const buf = [];
	//region name
	buf.push("<b>" + rg.properties.na + "</b><br>");

	//stat 1 value
	const sv1 = map.statData("v1").get(rg.properties.id);
	if (!sv1 || (sv1.value != 0 && !sv1.value)) buf.push(map.noDataText_);
	else buf.push(sv1.value);

	buf.push("<br>");

	//stat 2 value
	const sv2 = map.statData("v2").get(rg.properties.id);
	if (!sv2 || (sv2.value != 0 && !sv2.value)) buf.push(map.noDataText_);
	else buf.push(sv2.value);

	return buf.join("");
};
