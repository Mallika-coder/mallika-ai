from typing import Dict, Any

from app.tools.base_tool import BaseTool


class ChartGeneratorTool(BaseTool):
    name = "chart_generator"
    description = "Generate chart configurations for data visualization (returns Highcharts-compatible JSON)"
    parameters = {
        "type": "object",
        "properties": {
            "chart_type": {
                "type": "string",
                "enum": ["line", "bar", "pie", "scatter", "area", "column"],
                "description": "Type of chart",
            },
            "title": {"type": "string", "description": "Chart title"},
            "data": {
                "type": "object",
                "description": "Chart data with categories and series",
            },
            "x_label": {"type": "string", "description": "X-axis label"},
            "y_label": {"type": "string", "description": "Y-axis label"},
        },
        "required": ["chart_type", "title", "data"],
    }

    async def execute(
        self,
        chart_type: str,
        title: str,
        data: Dict,
        x_label: str = "",
        y_label: str = "",
    ) -> Dict[str, Any]:
        config = {
            "chart": {"type": chart_type},
            "title": {"text": title},
            "xAxis": {
                "categories": data.get("categories", []),
                "title": {"text": x_label},
            },
            "yAxis": {"title": {"text": y_label}},
            "series": data.get("series", []),
            "plotOptions": {
                "series": {"animation": True},
            },
            "credits": {"enabled": False},
        }

        if chart_type == "pie":
            config["plotOptions"]["pie"] = {
                "allowPointSelect": True,
                "cursor": "pointer",
                "dataLabels": {"enabled": True, "format": "{point.name}: {point.percentage:.1f}%"},
            }

        return {"chart_config": config, "type": chart_type}
