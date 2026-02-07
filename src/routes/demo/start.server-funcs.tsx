import fs from "node:fs";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";

import styles from "./demo.module.css";

/*
const loggingMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    console.log("Request:", request.url);
    return next();
  }
);
const loggedServerFunction = createServerFn({ method: "GET" }).middleware([
  loggingMiddleware,
]);
*/

const TODOS_FILE = "todos.json";

async function readTodos(): Promise<{ id: number; name: string }[]> {
	return JSON.parse(
		await fs.promises.readFile(TODOS_FILE, "utf-8").catch(() =>
			JSON.stringify(
				[
					{ id: 1, name: "Get groceries" },
					{ id: 2, name: "Buy a new phone" },
				],
				null,
				2,
			),
		),
	);
}

const getTodos = createServerFn({
	method: "GET",
}).handler(async () => await readTodos());

const addTodo = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data }) => {
		const todos = await readTodos();
		todos.push({ id: todos.length + 1, name: data });
		await fs.promises.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2));
		return todos;
	});

export const Route = createFileRoute("/demo/start/server-funcs")({
	component: Home,
	loader: async () => await getTodos(),
});

function Home() {
	const router = useRouter();
	let todos = Route.useLoaderData();

	const [todo, setTodo] = useState("");

	const submitTodo = useCallback(async () => {
		todos = await addTodo({ data: todo });
		setTodo("");
		router.invalidate();
	}, [addTodo, todo]);

	return (
		<div
			className={styles.page}
			style={{
				backgroundImage:
					"radial-gradient(50% 50% at 20% 60%, #23272a 0%, #18181b 50%, #000000 100%)",
			}}
		>
			<div className={styles.card}>
				<h1 className={styles.title}>Start Server Functions - Todo Example</h1>
				<ul className={`${styles.list} ${styles.listTight} ${styles.listMarginBottom}`}>
					{todos?.map((t) => (
						<li key={t.id} className={`${styles.listItem} ${styles.listItemSmall}`}>
							<span className={styles.itemNamePlain}>{t.name}</span>
						</li>
					))}
				</ul>
				<div className={styles.form}>
					<input
						type="text"
						value={todo}
						onChange={(e) => setTodo(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								submitTodo();
							}
						}}
						placeholder="Enter a new todo..."
						className={styles.input}
					/>
					<button
						disabled={todo.trim().length === 0}
						onClick={submitTodo}
						className={styles.button}
					>
						Add todo
					</button>
				</div>
			</div>
		</div>
	);
}
