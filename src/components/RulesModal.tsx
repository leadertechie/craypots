interface Props {
  onClose: () => void;
}

export default function RulesModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📜 Craypots Rules</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <section>
            <h3>🎯 Objective</h3>
            <p>Catch as many crabs as possible using boats and crab pots. Score points based on crabs caught, but beware of storms that can destroy your boats and pots!</p>
          </section>

          <section>
            <h3>⚓ Boats</h3>
            <ul>
              <li>You start with <strong>3 boats</strong></li>
              <li>Place boats in ocean zones to deploy pots from there</li>
              <li><strong>You don't have to use all boats</strong> - more boats = more pots deployed = more points</li>
              <li>In <strong>heavy storms</strong>, you may lose a boat permanently!</li>
            </ul>
          </section>

          <section>
            <h3>🦞 Crab Pots</h3>
            <ul>
              <li>You start with <strong>9 pots</strong>:
                <ul>
                  <li>2 Large pots (capacity: 10 crabs each)</li>
                  <li>3 Medium pots (capacity: 6 crabs each)</li>
                  <li>4 Small pots (capacity: 3 crabs each)</li>
                </ul>
              </li>
              <li><strong>You don't have to use all pots</strong> - unused pots carry over to next round</li>
              <li>Pots are placed <strong>on boats</strong> - each boat can only hold so many pots</li>
            </ul>
          </section>

          <section>
            <h3>⚖️ Boat Pot Limits</h3>
            <table className="rules-table">
              <thead>
                <tr>
                  <th>Boat Size</th>
                  <th>Max Pots</th>
                  <th>Valid Combinations</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Small Boat</td>
                  <td>2 pots</td>
                  <td>Any 2 small OR 1 small + 1 medium</td>
                </tr>
                <tr>
                  <td>Medium Boat</td>
                  <td>3 pots</td>
                  <td>Any 3 small/medium OR 2 small + 1 medium</td>
                </tr>
                <tr>
                  <td>Large Boat</td>
                  <td>4 pots</td>
                  <td>Any combination up to 4 pots (max 1 large)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3>🗺️ Ocean Zones</h3>
            <table className="rules-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Multiplier</th>
                  <th>Storm Risk</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>🏖️ Shallow</td>
                  <td>×1</td>
                  <td>No risk</td>
                </tr>
                <tr>
                  <td>🌊 Medium</td>
                  <td>×2</td>
                  <td>Mild storm: 15% pot loss</td>
                </tr>
                <tr>
                  <td>🌑 Deep</td>
                  <td>×3</td>
                  <td>Mild storm: 30% pot loss</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3>🎲 Weather & Storms</h3>
            <ul>
              <li><strong>Calm</strong> (50% chance): All pots return safely</li>
              <li><strong>Mild</strong> (33% chance): Some pots may be lost in storm</li>
              <li><strong>Heavy</strong> (17% chance): All pots lost + risk of losing a boat!</li>
            </ul>
          </section>

          <section>
            <h3>🏆 Scoring</h3>
            <ul>
              <li>Points = (pot capacity) × (zone multiplier)</li>
              <li>Example: Large pot (10) in Deep zone (×3) = 30 points</li>
              <li>Lose points when boats/pots are destroyed by storms</li>
              <li>Game ends when all players agree or admin stops it</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
