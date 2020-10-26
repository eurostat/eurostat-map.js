import { select, event } from "d3-selection";

/**
 * @param {*} config
 * @returns
 */
export const tooltip = function (config) {
	config = config || {};
	config.div = config.div || "tooltip_eurostat";
	config.maxWidth = config.maxWidth || "150px";
	config.fontSize = config.fontSize || "16px";
	config.background = config.background || "white";
	config.padding = config.padding || "5px";
	config.border = config.border || "0px";
	config["border-radius"] = config["border-radius"] || "5px";
	config["box-shadow"] = config["box-shadow"] || "5px 5px 5px grey";
	config["font-family"] = config["font-family"] || "Helvetica, Arial, sans-serif";

	config.transitionDuration = config.transitionDuration || 200;
	config.xOffset = config.xOffset || 30;
	config.yOffset = config.yOffset || 20;

	var tooltip;

	function my() {
		tooltip = select("#" + config.div);
		if (tooltip.empty())
			tooltip = select("body").append("div").attr("id", config.div);

		//tooltip.style("width",config.width);
		tooltip.style("max-width", config.maxWidth);
		tooltip.style("overflow", "hidden");

		tooltip.style("font-size", config.fontSize);
		tooltip.style("background", config.background);
		tooltip.style("padding", config.padding);
		tooltip.style("border", config.border);
		tooltip.style("border-radius", config["border-radius"]);
		tooltip.style("box-shadow", config["box-shadow"]);
		tooltip.style("position", "absolute");
		tooltip.style("font-family", config["font-family"]);

		tooltip.style("position", "absolute");
		tooltip.style("pointer-events", "none");
		tooltip.style("opacity", "0");
	}

	my.mouseover = function (html) {
		tooltip.html(html)
			.style("left", (event.pageX + config.xOffset) + "px").style("top", (event.pageY - config.yOffset) + "px")
			.transition().duration(config.transitionDuration).style("opacity", 1);
	};

	my.mousemove = function () {
		tooltip.style("left", (event.pageX + config.xOffset) + "px").style("top", (event.pageY - config.yOffset) + "px");
	};

	my.mouseout = function () {
		tooltip.transition().duration(config.transitionDuration).style("opacity", 0);
	};

	my.style = function (k, v) {
		if (arguments.length == 1) return tooltip.style(k);
		tooltip.style(k, v);
		return my;
	};

	my.attr = function (k, v) {
		if (arguments.length == 1) return tooltip.attr(k);
		tooltip.attr(k, v);
		return my;
	};

	my();
	return my;
};
