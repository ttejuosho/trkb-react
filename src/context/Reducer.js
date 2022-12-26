export const initialState = {
  token: null,
  companyUID: "",
  locationUID: "",
  companyUIDInputDisabled: false,
};

export const actionTypes = {
  SET_TOKEN: "SET_TOKEN",
  SET_COMPANYUID: "SET_COMPANYUID",
  SET_LOCATIONUID: "SET_LOCATIONUID",
  SET_COMPANYUID_INPUT_DISABLED: "SET_COMPANYUID_INPUT_DISABLED",
};

const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_TOKEN:
      return {
        ...state,
        token: action.token,
      };
    case actionTypes.SET_COMPANYUID:
      return {
        ...state,
        companyUID: action.companyUID,
      };
    case actionTypes.SET_LOCATIONUID:
      return {
        ...state,
        locationUID: action.locationUID,
      };
    case actionTypes.SET_COMPANYUID_INPUT_DISABLED:
      return {
        ...state,
        companyUIDInputDisabled: action.companyUIDInputDisabled,
      };
    default:
      return state;
  }
};

export default reducer;
