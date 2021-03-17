const initialState = {
  hideHeader: null
};

function configReducer(state = initialState, action) {
  switch (action.type) {
    case 'CONFIG_CHANGE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export default configReducer;
