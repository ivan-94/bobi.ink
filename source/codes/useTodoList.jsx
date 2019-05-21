function useTodoList() {
  // 假设usePromise类型为
  // <T>(fn: (...args: any[]) => Promise<T>, defaultValue: T) =>
  //  {
  //    loading:boolean,
  //     value: T,
  //     setValue: (T) => void,
  //     error?: Error,
  //     call: (...args: any[]) => Promise<T>
  //   }
  const todoList = usePromise(async () => fetchTodoList(), []);

  // 衍生状态
  const completed = useMemo(() => todoList.value.filter(i => i.completed), [todoList.value]);

  // 方法
  const remove = useAsync(async id => {
    /*...*/
  }, []);
  const complete = useAsync(async id => {
    /*..*/
  }, []);

  // 衍生副作用
  useOnUpdate(() => {
    // handle todoList value
  }, [todoList.value]);

  return { todoList, completed, mutations: { remove, complete } };
}


// Demo

const todoListStore = createContainer(useTodoList);

function Demo() {
  const { todoList } = useContainer(todoListStore);

  useEffect(() => {
    // 获取最新列表
    todoList.call();
  }, []);

  return <List loading={todoList.loading} error={todoList.error} dataSource={todoList.value} />;
}