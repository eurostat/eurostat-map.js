import { color } from "d3-color";
import { scaleQuantile } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";
import * as smap from '../core/stat-map';
//import * as lgch from '../legend/legend-choropleth';

/**
 * Return a bivariate choropleth map.
 * See: https://gistbok.ucgis.org/bok-topics/multivariate-mapping
 * 
 * @param {*} config 
 */
export const map = function (config) {

	//create map object to return, using the template
	const out = smap.statMap(config);

	out.clnb_ = 5;
	out.startColor_ = "#e8e8e8";
	out.color1_ = "#73ae80";
	out.color2_ = "#6c83b5";
	out.endColor_ = "#2a5a5b";

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
	["clnb_", "startColor_", "color1_", "color2_", "endColor_", "noDataFillStyle_", "classifier_"]
		.forEach(function (att) {
			out[att.substring(0, att.length - 1)] = function(v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
		});

	//override attribute values with config values
	if(config) ["clnb", "startColor", "color1", "color2", "endColor", "noDataFillStyle"].forEach(function (key) {
		if(config[key]!=undefined) out[key](config[key]);
	});

	//@override
	out.updateClassification = function () {

		//define bivariate scale
		const scale = scaleBivariate(
			out.clnb(),
			out.statData("v1").getArray(), out.statData("v2").getArray(),
			out.startColor(), out.color1(), out.color2(), out.endColor()
		);

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


const scaleBivariate = function(clnb, domain1, domain2, startColor, color1, color2, endColor) {

	//make single classifiers
	//TODO extract this out
	//const range = []; for(let i=0; i<=1; i+=1.0/(clnb-1)) range.push(i);
	const range = [...Array(clnb).keys()];
	console.log(range)
	const s1 = scaleQuantile().domain(domain1).range(range);
	const s2 = scaleQuantile().domain(domain2).range(range);

	//color ramps, by row
	const cs = [];
	//interpolate from first and last columns
	const rampS1 = interpolateRgb(startColor, color1);
	const ramp2E = interpolateRgb(color2, endColor);
	for(let i=0; i<clnb; i++) {
		const t = i/(clnb-1);
		cs.push( interpolateRgb( rampS1(t) , ramp2E(t)) );
	}





	return function(v1, v2) {

		//compute color coordinates
		const t1 = s1(v1), t2 = s2(v2);

		//get four colors
		const cS1 = rampS1(t1), c1E = ramp1E(t1)
		const cS2 = rampS2(t2), c2E = ramp2E(t2)


		return "gray"

		//get rgba colors
		const col1 = s1(v1), col2 = s2(v2);

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
