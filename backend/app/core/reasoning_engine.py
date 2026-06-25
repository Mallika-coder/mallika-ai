from typing import List, Dict, AsyncGenerator


class ReasoningEngine:
    """Handles chain-of-thought reasoning for complex queries."""

    def __init__(self, llm_provider):
        self.llm = llm_provider

    async def think_step_by_step(
        self, question: str, context: str = ""
    ) -> AsyncGenerator[Dict, None]:
        thinking_prompt = f"""Think through this problem step by step. Show your reasoning clearly.

Context: {context}

Question: {question}

Break down your thinking into clear steps, then provide a final answer."""

        messages = [
            {"role": "system", "content": "You are a careful analytical thinker. Show your reasoning step by step."},
            {"role": "user", "content": thinking_prompt},
        ]

        yield {"type": "thinking_start"}

        async for chunk in self.llm.generate(messages, stream=True):
            if chunk["type"] == "text":
                yield {"type": "thinking", "content": chunk["content"]}

        yield {"type": "thinking_end"}

    async def decompose_task(self, task: str) -> List[str]:
        messages = [
            {"role": "system", "content": "Break complex tasks into ordered subtasks. Return as JSON array of strings."},
            {"role": "user", "content": f"Break this task into subtasks:\n{task}"},
        ]

        result = ""
        async for chunk in self.llm.generate(messages, stream=False):
            if chunk["type"] == "complete":
                content = chunk["content"]
                result = content.content if hasattr(content, "content") else str(content)

        import json
        try:
            return json.loads(result)
        except (json.JSONDecodeError, TypeError):
            return [task]
