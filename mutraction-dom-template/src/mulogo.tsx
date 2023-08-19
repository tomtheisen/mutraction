const treads = 32;
let stops = "";

for (let i = 0; i < treads; i++) {
  const color = i % 2 ? "#0000" : "#000";
  stops += `\n , ${ color } ${ i / treads }turn, ${ color } ${ (i+1) / treads }turn`;
}

const styles = `
  .tread {
    display: inline-block;
    width:200px;
    height:200px;
    border-radius:100%;
    background: 
      radial-gradient(#fff 40%, #000 41%, #000 63%, #0000 64%),
      conic-gradient(from 90deg at 50% 50%
      ${ stops }
    );
  }

  .mu {
    width: 100%;
    height: 100%;
    padding: 83px 52px;
    color: #0256ff;
    font: italic bold 1000% "Calibri", "Arial", "Helvetica", sans-serif;
    line-height: 0;
  }

  @keyframes rotating {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .rotating         { animation: rotating 20s linear infinite; }
  .rotating-reverse { animation: rotating 20s linear infinite reverse; }
`;

export const mu = <>
    <div className="tread rotating">
      <div className="mu rotating-reverse">μ</div>
    </div>
    <style>
        {styles}
    </style>
</>;
