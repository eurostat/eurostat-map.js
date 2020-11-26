import { select } from "d3-selection";
import { scaleSqrt } from "d3-scale";
import * as mt from '../eurostat-map-template';
import * as lgps from '../legend/legend-proportionnal-symbols';


export const map = function () {

	//create map object to return, using the template
	const out = mt.mapTemplate(true);

	//out.psShape_ = CIRCLE; //TODO specify other shapes than simply circles
	out.psMaxSize_ = 30;
	out.psMinSize_ = 0.8;
	out.psMinValue_ = 0;
	out.psFill_ = "#B45F04";
	out.psFillOpacity_ = 0.7;
	out.psStroke_ = "#fff";
	out.psStrokeWidth_ = 0.3;
	//the classifier: a function which return a class number from a stat value.
	out.classifier_ = undefined;


	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	["psMaxSize_","psMinSize_","psMinValue_","psFill_","psFillOpacity_","psStroke_","psStrokeWidth_","classifier_"]
	.forEach(function(att) {
		out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
	});

	//override of some special getters/setters
    out.legend = function (v) {
		if (!arguments.length) {
			//create legend if needed
			if(!out.legend_) out.legend_ = lgps.legendProportionnalSymbols(out);
			return out.legend_;
		}
		//setter: link map and legend
		out.legend_ = v; v.map(out);
		return out;
	};



	//@override
	out.updateClassification = function () {
		out.classifier( scaleSqrt().domain([out.psMinValue_, Math.max.apply(Math, out._values)]).range([out.psMinSize_ * 0.5, out.psMaxSize_ * 0.5]) );
		return out;
	};



	//@override
	out.updateStyle = function () {
		//see https://bl.ocks.org/mbostock/4342045 and https://bost.ocks.org/mike/bubble-map/

		//set circle radius depending on stat value
		if(out._nutsRG)
		out.svg().select("#g_ps").selectAll("circle.symbol")

			//TODO should not be done everytime, only once is sufficient... Move that at build level
			.on("mouseover", function (rg) {
				select(this).style("fill", out.nutsrgSelectionFillStyle_);
				if (out.tooltipText_) { out._tooltip.mouseover(out.tooltipText_(rg, out)); }
			}).on("mousemove", function () {
				if (out.tooltipText_) out._tooltip.mousemove();
			}).on("mouseout", function () {
				select(this).style("fill", out.psFill_);
				if (out.tooltipText_) out._tooltip.mouseout();
			})

			.transition().duration(out.transitionDuration())
			.attr("r", function (d) { return d.properties.val ? out.classifier()(+d.properties.val) : 0; })
			.style("fill", out.psFill_)
			.style("fill-opacity", out.psFillOpacity_)
			.style("stroke", out.psStroke_)
			.style("stroke-width", out.psStrokeWidth_);

        return out;
	};


    return out;
}