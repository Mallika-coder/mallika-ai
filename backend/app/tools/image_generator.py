import base64
import os
import uuid
from typing import Dict, Any
import httpx

from app.tools.base_tool import BaseTool
from app.config import settings


class ImageGeneratorTool(BaseTool):
    name = "image_generator"
    description = "Generate images from text descriptions. Use this when the user asks to create, draw, or generate an image."

    def schema(self) -> Dict:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "prompt": {
                            "type": "string",
                            "description": "Detailed description of the image to generate"
                        },
                        "style": {
                            "type": "string",
                            "enum": ["photorealistic", "digital-art", "anime", "oil-painting", "watercolor", "sketch"],
                            "description": "Art style for the generated image"
                        },
                        "size": {
                            "type": "string",
                            "enum": ["256x256", "512x512", "1024x1024"],
                            "description": "Image dimensions"
                        }
                    },
                    "required": ["prompt"]
                }
            }
        }

    async def execute(self, prompt: str, style: str = "photorealistic", size: str = "512x512", **kwargs) -> Dict[str, Any]:
        # Try OpenAI DALL-E if key available
        if settings.openai_api_key:
            try:
                import openai
                client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
                response = await client.images.generate(
                    model="dall-e-3",
                    prompt=f"{prompt}, style: {style}",
                    size="1024x1024",
                    quality="standard",
                    n=1,
                    response_format="b64_json",
                )
                image_data = response.data[0].b64_json

                # Save to file
                filename = f"{uuid.uuid4().hex[:8]}.png"
                filepath = os.path.join(settings.upload_dir, "generated", filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)

                with open(filepath, "wb") as f:
                    f.write(base64.b64decode(image_data))

                return {
                    "status": "success",
                    "image_url": f"/api/files/generated/{filename}",
                    "image_base64": image_data[:100] + "...",  # Truncated for display
                    "prompt": prompt,
                    "style": style,
                    "size": size,
                    "message": f"Image generated successfully for: {prompt}"
                }
            except Exception as e:
                return {"status": "error", "message": f"Image generation failed: {str(e)}"}

        # Fallback: return a placeholder SVG
        w, h = size.split("x")
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <rect width="100%" height="100%" fill="#1e293b"/>
  <text x="50%" y="40%" text-anchor="middle" fill="#94a3b8" font-family="system-ui" font-size="16">Image Generation</text>
  <text x="50%" y="55%" text-anchor="middle" fill="#64748b" font-family="system-ui" font-size="12">{prompt[:50]}</text>
  <text x="50%" y="70%" text-anchor="middle" fill="#475569" font-family="system-ui" font-size="10">(Add OPENAI_API_KEY for DALL-E 3)</text>
</svg>'''

        svg_b64 = base64.b64encode(svg.encode()).decode()
        return {
            "status": "placeholder",
            "image_svg": svg,
            "image_base64": svg_b64,
            "prompt": prompt,
            "style": style,
            "size": size,
            "message": f"Generated placeholder for: {prompt}. Set OPENAI_API_KEY for real image generation with DALL-E 3."
        }
