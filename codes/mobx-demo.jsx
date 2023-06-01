/**
 * TodoStore.ts
 */
class Todo {
  public id = Math.random();
  @observable public title: boolean;
  @observable public finished = false;
  public constructor(title: string) {
    this.title = title;
  }
}

class TodoStore {
  @observable public todos: Todo[] = [];
  @computed
  public get unfinishedTodoCount() {
    return this.todos.filter(todo => !todo.finished).length;
  }
}

export default new TodoStore();

/**
 * TodoList.tsx
 */

@observer
class TodoListView extends React.Component<{ store: TodoStore }> {
  public render() {
    const { todos } = store;
    return (
      <TodoList>
        {todos.map(i => (
          <Todo item={i} key={i.id} />
        ))}
      </TodoList>
    );
  }
}

/**
 * App.tsx
 */
render(<TodoListView store={todoStore} />);