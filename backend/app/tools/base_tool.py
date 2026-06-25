from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseTool(ABC):
    name: str
    description: str
    parameters: Dict

    @abstractmethod
    async def execute(self, **kwargs) -> Dict[str, Any]:
        pass

    def schema(self) -> Dict:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }
