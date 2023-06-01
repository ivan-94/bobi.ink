import React from 'react';

export const HomeStore = React.createContext({
  state: INITIAL_STATE,
  mutations: {},
});

export default class HomeProvider extends React.Component {
  state = INITIAL_STATE;

  localeChange = locale => this.setState({ locale });
  themeChange = theme => this.setState({ theme });

  render() {
    return (
      <HomeStore.Provider
        value={{
          state: this.state,
          mutations: {
            localeChange: this.localeChange,
            themeChange: this.themeChange,
          },
        }}
      />
    );
  }
}

// Settings.js
function Settings(props) {
  const { state, mutations } = useContext(HomeStore);

  return <div>....</div>;
}

// index.js
<HomeProvider>
  <Settings />
</HomeProvider>;
