const Counter = () => {
  const [num, setNum] = React.useState(0);
  return (
    <>
      <button
        type="button"
        onClick={() =>setNum((x) => x + 1)}>
        +
      </button>
      <button
        type="button"
        onClick={() =>setNum((x) => x - 1)}>
        -
      </button>
      <br />
      {num}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById('app'));

root.render(<Counter />);