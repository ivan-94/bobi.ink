import { types } from 'mobx-state-tree';

// 创建模型
const Todo = types.model({
  title: types.string,
});

const TodoStore = types
  // 1
  .model('TodoStore', {
    loading: types.boolean, // 2 数据类型
    endpoint: 'http://localhost', // 3
    todos: types.array(Todo), // 4 应用模型
    selectedTodo: types.reference(Todo), // 5
  })
  .views(self => {
    return {
      // 6 等价于computed，和数据库的‘视图’概念一样
      get completedTodos() {
        return self.todos.filter(t => t.done);
      },
      // 7
      findTodosByUser(user) {
        return self.todos.filter(t => t.assignee === user);
      },
    };
  })
  .actions(self => {
    return {
      addTodo(title) {
        self.todos.push({
          id: Math.random(),
          title,
        });
      },
      // 异步action，类似于saga
      fetchTodo: flow(function*() {
        self.loading = true;
        try {
          self.todos = yield fetchTodos();
        } catch (error) {
          console.error('Failed to fetch projects', error);
        } finally {
          self.loading = false;
        }
      }),
    };
  });

// 创建实例
const storeInstance = TodoStore.create({
  todos: [
    {
      id: '47',
      title: 'Get coffee',
    },
  ],
  selectedTodo: '47',
});
