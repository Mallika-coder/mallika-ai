import os
from typing import Dict, Any

from app.tools.base_tool import BaseTool


class DataAnalyzerTool(BaseTool):
    name = "data_analyzer"
    description = "Analyze data from CSV/XLSX files. Compute statistics, correlations, trends, and generate insights."
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {"type": "string", "description": "Path to the data file"},
            "analysis_type": {
                "type": "string",
                "enum": ["summary", "correlation", "trends", "custom"],
                "description": "Type of analysis to perform",
            },
            "custom_query": {
                "type": "string",
                "description": "Custom pandas expression to evaluate",
            },
        },
        "required": ["file_path", "analysis_type"],
    }

    async def execute(
        self, file_path: str, analysis_type: str, custom_query: str = None
    ) -> Dict[str, Any]:
        import pandas as pd
        import numpy as np

        if not os.path.exists(file_path):
            return {"error": f"File not found: {file_path}"}

        ext = os.path.splitext(file_path)[1].lower()
        try:
            df = pd.read_csv(file_path) if ext == ".csv" else pd.read_excel(file_path)
        except Exception as e:
            return {"error": f"Failed to read file: {str(e)}"}

        if analysis_type == "summary":
            return {
                "shape": list(df.shape),
                "columns": list(df.columns),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
                "describe": df.describe().to_dict(),
                "null_counts": df.isnull().sum().to_dict(),
                "sample": df.head(5).to_dict(),
            }
        elif analysis_type == "correlation":
            numeric_df = df.select_dtypes(include=[np.number])
            if numeric_df.empty:
                return {"error": "No numeric columns found for correlation analysis"}
            return {"correlation_matrix": numeric_df.corr().to_dict()}
        elif analysis_type == "trends":
            numeric_df = df.select_dtypes(include=[np.number])
            trends = {}
            for col in numeric_df.columns:
                series = numeric_df[col].dropna()
                if len(series) > 1:
                    trends[col] = {
                        "mean": float(series.mean()),
                        "std": float(series.std()),
                        "min": float(series.min()),
                        "max": float(series.max()),
                        "trend": "increasing" if series.iloc[-1] > series.iloc[0] else "decreasing",
                        "pct_change": float(((series.iloc[-1] - series.iloc[0]) / series.iloc[0] * 100)) if series.iloc[0] != 0 else 0,
                    }
            return {"trends": trends}
        elif analysis_type == "custom" and custom_query:
            try:
                result = eval(custom_query, {"df": df, "pd": pd, "np": np})
                if isinstance(result, pd.DataFrame):
                    return {"result": result.head(50).to_dict()}
                elif isinstance(result, pd.Series):
                    return {"result": result.head(50).to_dict()}
                return {"result": str(result)}
            except Exception as e:
                return {"error": f"Query execution failed: {str(e)}"}

        return {"error": "Invalid analysis type"}
